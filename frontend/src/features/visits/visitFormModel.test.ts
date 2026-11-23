import type { Visit } from '../../api/types'
import {
  emptyVisitFormValues,
  todayIso,
  toVisitInput,
  validateVisitForm,
  visitToFormValues,
  type VisitFormValues,
} from './visitFormModel'

const validValues: VisitFormValues = {
  schoolId: '1',
  teacherId: '2',
  specialistId: '',
  visitDate: '2026-11-20',
  visitType: 'meeting',
  observations: 'Planificación del lapso.',
}

describe('todayIso', () => {
  it('formats the local date with zero padding', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(todayIso(new Date(2026, 10, 22))).toBe('2026-11-22')
  })
})

describe('validateVisitForm', () => {
  it('accepts a complete form', () => {
    expect(validateVisitForm(validValues, '2026-11-22')).toEqual({})
  })

  it('asks for every field a specialist must fill when the form is empty', () => {
    expect(validateVisitForm(emptyVisitFormValues, '2026-11-22')).toEqual({
      schoolId: 'Selecciona un colegio.',
      teacherId: 'Selecciona un docente.',
      visitDate: 'Ingresa la fecha de la visita.',
      visitType: 'Selecciona el tipo de visita.',
      observations: 'Escribe las observaciones de la visita.',
    })
  })

  it('does not ask a specialist to choose a specialist', () => {
    expect(validateVisitForm(validValues, '2026-11-22').specialistId).toBeUndefined()
  })

  it('asks an administrator to choose a specialist', () => {
    const errors = validateVisitForm(validValues, '2026-11-22', { requireSpecialist: true })

    expect(errors).toEqual({ specialistId: 'Selecciona un especialista.' })
  })

  it('accepts an administrator form once the specialist is chosen', () => {
    const values = { ...validValues, specialistId: '3' }

    expect(validateVisitForm(values, '2026-11-22', { requireSpecialist: true })).toEqual({})
  })

  it('rejects dates in the future', () => {
    const errors = validateVisitForm({ ...validValues, visitDate: '2026-11-23' }, '2026-11-22')

    expect(errors.visitDate).toBe('La fecha de la visita no puede ser futura.')
  })

  it('accepts today', () => {
    expect(validateVisitForm({ ...validValues, visitDate: '2026-11-22' }, '2026-11-22')).toEqual({})
  })

  it('treats observations made only of spaces as empty', () => {
    const errors = validateVisitForm({ ...validValues, observations: '   \n ' }, '2026-11-22')

    expect(errors.observations).toBe('Escribe las observaciones de la visita.')
  })
})

describe('toVisitInput', () => {
  it('converts the identifiers to numbers and trims the observations', () => {
    expect(toVisitInput({ ...validValues, observations: '  Texto  ' })).toEqual({
      schoolId: 1,
      teacherId: 2,
      visitDate: '2026-11-20',
      visitType: 'meeting',
      observations: 'Texto',
    })
  })

  it('does not send a specialist unless asked to', () => {
    expect(toVisitInput({ ...validValues, specialistId: '3' })).not.toHaveProperty('specialistId')
  })

  it('sends the chosen specialist as a number for administrators', () => {
    const input = toVisitInput({ ...validValues, specialistId: '3' }, { includeSpecialist: true })

    expect(input.specialistId).toBe(3)
  })
})

describe('visitToFormValues', () => {
  it('turns a visit into the values of the form', () => {
    const visit: Visit = {
      id: 9,
      school: { id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' },
      teacher: { id: 2, schoolId: 1, firstName: 'Ana', lastName: 'Rojas', fullName: 'Ana Rojas' },
      specialist: { id: 4, fullName: 'María González' },
      visitDate: '2026-11-20',
      visitType: 'classroom_visit',
      observations: 'Notas',
      createdAt: '2026-11-22T18:15:00-04:00',
      updatedAt: '2026-11-22T18:15:00-04:00',
    }

    expect(visitToFormValues(visit)).toEqual({
      schoolId: '1',
      teacherId: '2',
      specialistId: '4',
      visitDate: '2026-11-20',
      visitType: 'classroom_visit',
      observations: 'Notas',
    })
  })
})
