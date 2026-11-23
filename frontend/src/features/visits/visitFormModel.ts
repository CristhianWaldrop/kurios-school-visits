import type { Visit, VisitInput, VisitType } from '../../api/types'

export interface VisitFormValues {
  schoolId: string
  teacherId: string
  specialistId: string
  visitDate: string
  visitType: VisitType | ''
  observations: string
}

export type VisitFormErrors = Partial<Record<keyof VisitFormValues | 'form', string>>

export const emptyVisitFormValues: VisitFormValues = {
  schoolId: '',
  teacherId: '',
  specialistId: '',
  visitDate: '',
  visitType: '',
  observations: '',
}

export function visitToFormValues(visit: Visit): VisitFormValues {
  return {
    schoolId: String(visit.school.id),
    teacherId: String(visit.teacher.id),
    specialistId: String(visit.specialist.id),
    visitDate: visit.visitDate,
    visitType: visit.visitType,
    observations: visit.observations,
  }
}

export function todayIso(now: Date = new Date()): string {
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

interface ValidationOptions {
  requireSpecialist?: boolean
}

export function validateVisitForm(
  values: VisitFormValues,
  today: string,
  { requireSpecialist = false }: ValidationOptions = {},
): VisitFormErrors {
  const errors: VisitFormErrors = {}

  if (requireSpecialist && !values.specialistId) errors.specialistId = 'Selecciona un especialista.'
  if (!values.schoolId) errors.schoolId = 'Selecciona un colegio.'
  if (!values.teacherId) errors.teacherId = 'Selecciona un docente.'
  if (!values.visitDate) {
    errors.visitDate = 'Ingresa la fecha de la visita.'
  } else if (values.visitDate > today) {
    errors.visitDate = 'La fecha de la visita no puede ser futura.'
  }
  if (!values.visitType) errors.visitType = 'Selecciona el tipo de visita.'
  if (!values.observations.trim()) errors.observations = 'Escribe las observaciones de la visita.'

  return errors
}

interface InputOptions {
  includeSpecialist?: boolean
}

export function toVisitInput(
  values: VisitFormValues,
  { includeSpecialist = false }: InputOptions = {},
): VisitInput {
  return {
    schoolId: Number(values.schoolId),
    teacherId: Number(values.teacherId),
    ...(includeSpecialist && { specialistId: Number(values.specialistId) }),
    visitDate: values.visitDate,
    visitType: values.visitType as VisitType,
    observations: values.observations.trim(),
  }
}
