import { useState, type FormEvent } from 'react'

import { describeError, getFieldErrors } from '../../api/errors'
import type { VisitInput } from '../../api/types'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { ButtonLink } from '../../components/ButtonLink'
import { SelectField } from '../../components/SelectField'
import { TextAreaField } from '../../components/TextAreaField'
import { TextField } from '../../components/TextField'
import { useAuth } from '../auth/useAuth'
import { useSchools } from '../directory/useSchools'
import { useSpecialists } from '../directory/useSpecialists'
import { useTeachers } from '../directory/useTeachers'
import {
  todayIso,
  toVisitInput,
  validateVisitForm,
  type VisitFormErrors,
  type VisitFormValues,
} from './visitFormModel'
import { visitTypeLabels, visitTypes } from './visitTypes'
import styles from './VisitForm.module.scss'

interface VisitFormProps {
  initialValues: VisitFormValues
  submitLabel: string
  cancelTo: string
  onSubmit: (input: VisitInput) => Promise<unknown>
}

export function VisitForm({ initialValues, submitLabel, cancelTo, onSubmit }: VisitFormProps) {
  const [values, setValues] = useState(initialValues)
  const [errors, setErrors] = useState<VisitFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'

  const schools = useSchools()
  const specialists = useSpecialists(isAdmin)
  const schoolId = values.schoolId ? Number(values.schoolId) : undefined
  const teachers = useTeachers(schoolId)
  const loadError = schools.error ?? teachers.error ?? specialists.error

  function setField<K extends keyof VisitFormValues>(field: K, value: VisitFormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined, form: undefined }))
  }

  function handleSchoolChange(value: string) {
    setValues((current) => ({ ...current, schoolId: value, teacherId: '' }))
    setErrors((current) => ({ ...current, schoolId: undefined, teacherId: undefined }))
  }

  function retryLoading() {
    if (schools.isError) void schools.refetch()
    if (teachers.isError) void teachers.refetch()
    if (specialists.isError) void specialists.refetch()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationErrors = validateVisitForm(values, todayIso(), { requireSpecialist: isAdmin })
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) return

    setIsSubmitting(true)
    try {
      await onSubmit(toVisitInput(values, { includeSpecialist: isAdmin }))
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      setErrors(Object.keys(fieldErrors).length > 0 ? fieldErrors : { form: describeError(error) })
      setIsSubmitting(false)
    }
  }

  function teacherPlaceholder(): string {
    if (schoolId === undefined) return 'Selecciona primero un colegio'
    if (teachers.isPending) return 'Cargando docentes…'
    if (teachers.data?.length === 0) return 'Este colegio no tiene docentes'
    return 'Selecciona un docente'
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      {errors.form && <Alert>{errors.form}</Alert>}

      {loadError && (
        <div className={styles.retry}>
          <Alert>{describeError(loadError)}</Alert>
          <Button variant="secondary" onClick={retryLoading}>
            Reintentar
          </Button>
        </div>
      )}

      {isAdmin && (
        <SelectField
          label="Especialista"
          value={values.specialistId}
          onChange={(event) => setField('specialistId', event.target.value)}
          error={errors.specialistId}
        >
          <option value="">
            {specialists.isPending ? 'Cargando especialistas…' : 'Selecciona un especialista'}
          </option>
          {specialists.data?.map((specialist) => (
            <option key={specialist.id} value={specialist.id}>
              {specialist.fullName}
            </option>
          ))}
        </SelectField>
      )}

      <SelectField
        label="Colegio"
        value={values.schoolId}
        onChange={(event) => handleSchoolChange(event.target.value)}
        error={errors.schoolId}
      >
        <option value="">
          {schools.isPending ? 'Cargando colegios…' : 'Selecciona un colegio'}
        </option>
        {schools.data?.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        label="Docente"
        value={values.teacherId}
        onChange={(event) => setField('teacherId', event.target.value)}
        disabled={schoolId === undefined || teachers.isPending}
        error={errors.teacherId}
      >
        <option value="">{teacherPlaceholder()}</option>
        {teachers.data?.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {teacher.fullName}
          </option>
        ))}
      </SelectField>

      <div className={styles.pair}>
        <TextField
          label="Fecha de la visita"
          type="date"
          max={todayIso()}
          value={values.visitDate}
          onChange={(event) => setField('visitDate', event.target.value)}
          error={errors.visitDate}
        />
        <SelectField
          label="Tipo de visita"
          value={values.visitType}
          onChange={(event) => setField('visitType', event.target.value as typeof values.visitType)}
          error={errors.visitType}
        >
          <option value="">Selecciona el tipo</option>
          {visitTypes.map((type) => (
            <option key={type} value={type}>
              {visitTypeLabels[type]}
            </option>
          ))}
        </SelectField>
      </div>

      <TextAreaField
        label="Observaciones"
        rows={6}
        value={values.observations}
        onChange={(event) => setField('observations', event.target.value)}
        error={errors.observations}
      />

      <div className={styles.actions}>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando…' : submitLabel}
        </Button>
        <ButtonLink to={cancelTo} variant="secondary">
          Cancelar
        </ButtonLink>
      </div>
    </form>
  )
}
