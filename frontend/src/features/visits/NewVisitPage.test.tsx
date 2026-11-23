import { fireEvent, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from '../../app/App'
import {
  schoolsWire,
  specialistWire,
  teacherWire,
  validationError,
  visitWire,
} from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { renderWithProviders } from '../../test/renderWithProviders'

const teachersOfSchool1 = [
  teacherWire(),
  teacherWire({
    id: 2,
    first_name: 'Pedro',
    last_name: 'Villalobos',
    full_name: 'Pedro Villalobos',
  }),
]
const teachersOfSchool2 = [
  teacherWire({
    id: 5,
    school: 2,
    first_name: 'Patricia',
    last_name: 'Salazar',
    full_name: 'Patricia Salazar',
  }),
]

const baseRoutes = {
  'GET /api/auth/me/': { body: specialistWire },
  'GET /api/schools/': { body: schoolsWire },
  'GET /api/teachers/?school=1': { body: teachersOfSchool1 },
  'GET /api/teachers/?school=2': { body: teachersOfSchool2 },
}

async function findSchoolSelect() {
  await screen.findByRole('option', { name: 'Colegio San Rafael' })
  return screen.getByLabelText('Colegio')
}

async function chooseSchoolAndTeacher() {
  await userEvent.selectOptions(await findSchoolSelect(), 'Colegio San Rafael')
  await screen.findByRole('option', { name: 'Ana Rojas' })
  await userEvent.selectOptions(screen.getByLabelText('Docente'), 'Ana Rojas')
}

async function fillRest(date = '2026-11-20') {
  fireEvent.change(screen.getByLabelText('Fecha de la visita'), { target: { value: date } })
  await userEvent.selectOptions(screen.getByLabelText('Tipo de visita'), 'Visita en aula')
  await userEvent.type(screen.getByLabelText('Observaciones'), 'Clase de ciencias')
}

function submit() {
  return userEvent.click(screen.getByRole('button', { name: 'Registrar visita' }))
}

describe('NewVisitPage', () => {
  it('shows the empty form', async () => {
    mockApi(baseRoutes)

    renderWithProviders(<App />, { route: '/visits/new' })

    expect(await screen.findByRole('heading', { name: 'Registrar visita' })).toBeInTheDocument()
    expect(await findSchoolSelect()).toHaveDisplayValue('Selecciona un colegio')
    expect(screen.getByLabelText('Fecha de la visita')).toHaveValue('')
    expect(screen.getByLabelText('Tipo de visita')).toHaveDisplayValue('Selecciona el tipo')
    expect(screen.getByLabelText('Observaciones')).toHaveValue('')
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/visits')
  })

  it('limits the date to today', async () => {
    mockApi(baseRoutes)

    renderWithProviders(<App />, { route: '/visits/new' })

    const date = await screen.findByLabelText('Fecha de la visita')
    expect(date).toHaveAttribute('type', 'date')
    expect(date).toHaveAttribute('max')
  })

  describe('teacher selection', () => {
    it('waits for a school before offering teachers', async () => {
      mockApi(baseRoutes)

      renderWithProviders(<App />, { route: '/visits/new' })

      const teacher = await screen.findByLabelText('Docente')
      expect(teacher).toBeDisabled()
      expect(teacher).toHaveDisplayValue('Selecciona primero un colegio')
    })

    it('offers only the teachers of the chosen school', async () => {
      const { calls } = mockApi(baseRoutes)
      renderWithProviders(<App />, { route: '/visits/new' })

      await userEvent.selectOptions(await findSchoolSelect(), 'Colegio San Rafael')

      expect(await screen.findByRole('option', { name: 'Ana Rojas' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Pedro Villalobos' })).toBeInTheDocument()
      expect(screen.queryByRole('option', { name: 'Patricia Salazar' })).not.toBeInTheDocument()
      expect(screen.getByLabelText('Docente')).toBeEnabled()
      expect(calls.some((call) => call.path === '/api/teachers/?school=1')).toBe(true)
    })

    it('forgets the teacher when the school changes, so it cannot be sent by mistake', async () => {
      const { calls } = mockApi(baseRoutes)
      renderWithProviders(<App />, { route: '/visits/new' })
      await chooseSchoolAndTeacher()
      expect(screen.getByLabelText('Docente')).toHaveDisplayValue('Ana Rojas')

      await userEvent.selectOptions(screen.getByLabelText('Colegio'), 'Colegio Santa Lucía')
      await screen.findByRole('option', { name: 'Patricia Salazar' })
      await fillRest()
      await submit()

      expect(screen.getByLabelText('Docente')).toHaveDisplayValue('Selecciona un docente')
      expect(screen.getByText('Selecciona un docente.')).toBeInTheDocument()
      expect(calls.some((call) => call.method === 'POST')).toBe(false)
    })

    it('says so when the school has no teachers', async () => {
      mockApi({ ...baseRoutes, 'GET /api/teachers/?school=1': { body: [] } })
      renderWithProviders(<App />, { route: '/visits/new' })

      await userEvent.selectOptions(await findSchoolSelect(), 'Colegio San Rafael')

      expect(await screen.findByLabelText('Docente')).toHaveDisplayValue(
        'Este colegio no tiene docentes',
      )
    })
  })

  describe('validation before sending', () => {
    it('asks for every field and does not contact the server', async () => {
      const { calls } = mockApi(baseRoutes)
      renderWithProviders(<App />, { route: '/visits/new' })
      await findSchoolSelect()

      await submit()

      expect(screen.getByText('Selecciona un colegio.')).toBeInTheDocument()
      expect(screen.getByText('Selecciona un docente.')).toBeInTheDocument()
      expect(screen.getByText('Ingresa la fecha de la visita.')).toBeInTheDocument()
      expect(screen.getByText('Selecciona el tipo de visita.')).toBeInTheDocument()
      expect(screen.getByText('Escribe las observaciones de la visita.')).toBeInTheDocument()
      expect(calls.some((call) => call.method === 'POST')).toBe(false)
    })

    it('rejects a future date', async () => {
      const { calls } = mockApi(baseRoutes)
      renderWithProviders(<App />, { route: '/visits/new' })
      await chooseSchoolAndTeacher()
      await fillRest('2999-01-01')

      await submit()

      expect(screen.getByText('La fecha de la visita no puede ser futura.')).toBeInTheDocument()
      expect(calls.some((call) => call.method === 'POST')).toBe(false)
    })

    it('clears the message of a field once it is corrected', async () => {
      mockApi(baseRoutes)
      renderWithProviders(<App />, { route: '/visits/new' })
      await findSchoolSelect()
      await submit()
      expect(screen.getByText('Escribe las observaciones de la visita.')).toBeInTheDocument()

      await userEvent.type(screen.getByLabelText('Observaciones'), 'Texto')

      expect(screen.queryByText('Escribe las observaciones de la visita.')).not.toBeInTheDocument()
    })
  })

  describe('sending', () => {
    it('registers the visit and shows it with a confirmation', async () => {
      const { calls } = mockApi({
        ...baseRoutes,
        'POST /api/visits/': { status: 201, body: visitWire({ id: 9 }) },
        'GET /api/visits/9/': { body: visitWire({ id: 9 }) },
      })
      renderWithProviders(<App />, { route: '/visits/new' })
      await chooseSchoolAndTeacher()
      await fillRest()

      await submit()

      expect(
        await screen.findByRole('heading', { name: 'Detalle de la visita' }),
      ).toBeInTheDocument()
      expect(screen.getByText('Visita registrada.')).toBeInTheDocument()
      expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
        school_id: 1,
        teacher_id: 1,
        visit_date: '2026-11-20',
        visit_type: 'classroom_visit',
        observations: 'Clase de ciencias',
      })
    })

    it('blocks the button while the request is in flight', async () => {
      let finish: () => void = () => {}
      mockApi({
        ...baseRoutes,
        'POST /api/visits/': () =>
          new Promise((resolve) => {
            finish = () => resolve({ status: 500, body: {} })
          }),
      })
      renderWithProviders(<App />, { route: '/visits/new' })
      await chooseSchoolAndTeacher()
      await fillRest()

      await submit()

      expect(await screen.findByRole('button', { name: 'Guardando…' })).toBeDisabled()
      finish()
      expect(await screen.findByRole('button', { name: 'Registrar visita' })).toBeEnabled()
    })

    it('shows the validation errors of the server in Spanish next to each field', async () => {
      mockApi({
        ...baseRoutes,
        'POST /api/visits/': validationError({
          visit_date: 'future_date',
          teacher_id: 'teacher_not_in_school',
        }),
      })
      renderWithProviders(<App />, { route: '/visits/new' })
      await chooseSchoolAndTeacher()
      await fillRest()

      await submit()

      expect(
        await screen.findByText('La fecha de la visita no puede ser futura.'),
      ).toBeInTheDocument()
      expect(
        screen.getByText('El docente no pertenece al colegio seleccionado.'),
      ).toBeInTheDocument()
      expect(screen.queryByText('English text')).not.toBeInTheDocument()
      expect(screen.getByLabelText('Observaciones')).toHaveValue('Clase de ciencias')
    })

    it('explains an unexpected server failure and keeps what was typed', async () => {
      mockApi({ ...baseRoutes, 'POST /api/visits/': { status: 500, body: {} } })
      renderWithProviders(<App />, { route: '/visits/new' })
      await chooseSchoolAndTeacher()
      await fillRest()

      await submit()

      expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.')
      expect(screen.getByLabelText('Observaciones')).toHaveValue('Clase de ciencias')
    })
  })

  it('lets the user retry when the schools cannot be loaded', async () => {
    let attempts = 0
    mockApi({
      ...baseRoutes,
      'GET /api/schools/': () => {
        attempts += 1
        return attempts === 1 ? { status: 500, body: {} } : { body: schoolsWire }
      },
    })
    renderWithProviders(<App />, { route: '/visits/new' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('option', { name: 'Colegio San Rafael' })).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
