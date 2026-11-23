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

  it('asks for every field when the form is empty', () => {
    expect(validateVisitForm(emptyVisitFormValues, '2026-11-22')).toEqual({
      schoolId: 'Selecciona un colegio.',
      teacherId: 'Selecciona un docente.',
      visitDate: 'Ingresa la fecha de la visita.',
      visitType: 'Selecciona el tipo de visita.',
      observations: 'Escribe las observaciones de la visita.',
    })
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
})

describe('visitToFormValues', () => {
  it('turns a visit into the values of the form', () => {
    const visit: Visit = {
      id: 9,
      school: { id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' },
      teacher: { id: 2, schoolId: 1, firstName: 'Ana', lastName: 'Rojas', fullName: 'Ana Rojas' },
      specialist: { id: 1, fullName: 'María González' },
      visitDate: '2026-11-20',
      visitType: 'classroom_visit',
      observations: 'Notas',
      createdAt: '2026-11-22T18:15:00-04:00',
      updatedAt: '2026-11-22T18:15:00-04:00',
    }

    expect(visitToFormValues(visit)).toEqual({
      schoolId: '1',
      teacherId: '2',
      visitDate: '2026-11-20',
      visitType: 'classroom_visit',
      observations: 'Notas',
    })
  })
})
