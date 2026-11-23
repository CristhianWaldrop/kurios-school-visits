import type { Visit, VisitInput, VisitType } from '../../api/types'

export interface VisitFormValues {
  schoolId: string
  teacherId: string
  visitDate: string
  visitType: VisitType | ''
  observations: string
}

export type VisitFormErrors = Partial<Record<keyof VisitFormValues | 'form', string>>

export const emptyVisitFormValues: VisitFormValues = {
  schoolId: '',
  teacherId: '',
  visitDate: '',
  visitType: '',
  observations: '',
}

export function visitToFormValues(visit: Visit): VisitFormValues {
  return {
    schoolId: String(visit.school.id),
    teacherId: String(visit.teacher.id),
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

export function validateVisitForm(values: VisitFormValues, today: string): VisitFormErrors {
  const errors: VisitFormErrors = {}

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

export function toVisitInput(values: VisitFormValues): VisitInput {
  return {
    schoolId: Number(values.schoolId),
    teacherId: Number(values.teacherId),
    visitDate: values.visitDate,
    visitType: values.visitType as VisitType,
    observations: values.observations.trim(),
  }
}
