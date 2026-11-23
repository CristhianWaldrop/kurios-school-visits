import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from '../../app/App'
import {
  adminWire,
  pageWire,
  schoolsWire,
  specialistsWire,
  specialistWire,
  teacherWire,
  validationError,
  visitWire,
} from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { renderWithProviders } from '../../test/renderWithProviders'

const adminRoutes = {
  'GET /api/auth/me/': { body: adminWire },
  'GET /api/schools/': { body: schoolsWire },
  'GET /api/specialists/': { body: specialistsWire },
  'GET /api/teachers/?school=1': { body: [teacherWire()] },
}

const othersVisit = visitWire({ specialist: { id: 2, full_name: 'Carlos Peña' } })

async function chooseSpecialist(name: string) {
  await screen.findByRole('option', { name })
  await userEvent.selectOptions(screen.getByLabelText('Especialista'), name)
}

async function fillVisit() {
  await screen.findByRole('option', { name: 'Colegio San Rafael' })
  await userEvent.selectOptions(screen.getByLabelText('Colegio'), 'Colegio San Rafael')
  await screen.findByRole('option', { name: 'Ana Rojas' })
  await userEvent.selectOptions(screen.getByLabelText('Docente'), 'Ana Rojas')
  fireEvent.change(screen.getByLabelText('Fecha de la visita'), { target: { value: '2026-11-20' } })
  await userEvent.selectOptions(screen.getByLabelText('Tipo de visita'), 'Encuentro')
  await userEvent.type(screen.getByLabelText('Observaciones'), 'Reunión de seguimiento')
}

describe('registering a visit as an administrator', () => {
  it('offers a specialist selector before everything else', async () => {
    mockApi(adminRoutes)

    renderWithProviders(<App />, { route: '/visits/new' })

    expect(await screen.findByRole('option', { name: 'María González' })).toBeInTheDocument()
    const select = screen.getByLabelText('Especialista')
    expect(select).toHaveDisplayValue('Selecciona un especialista')
    expect(screen.getByRole('option', { name: 'Carlos Peña' })).toBeInTheDocument()
    const labels = screen.getAllByRole('combobox').map((combobox) => combobox.id)
    expect(labels[0]).toBe(select.id)
  })

  it('does not let the administrator send the form without a specialist', async () => {
    const { calls } = mockApi(adminRoutes)
    renderWithProviders(<App />, { route: '/visits/new' })
    await fillVisit()

    await userEvent.click(screen.getByRole('button', { name: 'Registrar visita' }))

    expect(screen.getByText('Selecciona un especialista.')).toBeInTheDocument()
    expect(calls.some((call) => call.method === 'POST')).toBe(false)
  })

  it('registers the visit for the chosen specialist', async () => {
    const { calls } = mockApi({
      ...adminRoutes,
      'POST /api/visits/': { status: 201, body: othersVisit },
      'GET /api/visits/1/': { body: othersVisit },
    })
    renderWithProviders(<App />, { route: '/visits/new' })
    await chooseSpecialist('Carlos Peña')
    await fillVisit()

    await userEvent.click(screen.getByRole('button', { name: 'Registrar visita' }))

    expect(await screen.findByText('Registrada por Carlos Peña')).toBeInTheDocument()
    expect(screen.getByText('Visita registrada.')).toBeInTheDocument()
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      school_id: 1,
      teacher_id: 1,
      specialist_id: 2,
      visit_date: '2026-11-20',
      visit_type: 'meeting',
      observations: 'Reunión de seguimiento',
    })
  })

  it('shows the server error of the specialist in Spanish', async () => {
    mockApi({
      ...adminRoutes,
      'POST /api/visits/': validationError({ specialist_id: 'does_not_exist' }),
    })
    renderWithProviders(<App />, { route: '/visits/new' })
    await chooseSpecialist('Carlos Peña')
    await fillVisit()

    await userEvent.click(screen.getByRole('button', { name: 'Registrar visita' }))

    expect(await screen.findByText('La opción seleccionada ya no existe.')).toBeInTheDocument()
  })

  it('lets the administrator retry when the specialists cannot be loaded', async () => {
    let attempts = 0
    mockApi({
      ...adminRoutes,
      'GET /api/specialists/': () => {
        attempts += 1
        return attempts === 1 ? { status: 500, body: {} } : { body: specialistsWire }
      },
    })
    renderWithProviders(<App />, { route: '/visits/new' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('option', { name: 'Carlos Peña' })).toBeInTheDocument()
  })
})

describe('a specialist registering a visit', () => {
  it('does not see the specialist selector nor load the specialists', async () => {
    const { calls } = mockApi({
      'GET /api/auth/me/': { body: specialistWire },
      'GET /api/schools/': { body: schoolsWire },
      'GET /api/teachers/?school=1': { body: [teacherWire()] },
      'POST /api/visits/': { status: 201, body: visitWire({ id: 9 }) },
      'GET /api/visits/9/': { body: visitWire({ id: 9 }) },
    })
    renderWithProviders(<App />, { route: '/visits/new' })
    await fillVisit()

    expect(screen.queryByLabelText('Especialista')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Registrar visita' }))

    expect(await screen.findByText('Visita registrada.')).toBeInTheDocument()
    expect(calls.find((call) => call.method === 'POST')?.body).not.toHaveProperty('specialist_id')
    expect(calls.some((call) => call.path === '/api/specialists/')).toBe(false)
  })
})

describe('editing and deleting as an administrator', () => {
  it('shows the edit and delete buttons for a visit of another specialist', async () => {
    mockApi({ ...adminRoutes, 'GET /api/visits/1/': { body: othersVisit } })

    renderWithProviders(<App />, { route: '/visits/1' })

    expect(await screen.findByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/visits/1/edit',
    )
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
    expect(screen.queryByText(/Solo quien registró la visita/)).not.toBeInTheDocument()
  })

  it('opens the edit form of another specialist with their name selected', async () => {
    mockApi({ ...adminRoutes, 'GET /api/visits/1/': { body: othersVisit } })

    renderWithProviders(<App />, { route: '/visits/1/edit' })

    expect(await screen.findByRole('heading', { name: 'Editar visita' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByLabelText('Especialista')).toHaveDisplayValue('Carlos Peña'),
    )
  })

  it('keeps the specialist when only the text changes', async () => {
    const { calls } = mockApi({
      ...adminRoutes,
      'GET /api/visits/1/': { body: othersVisit },
      'PATCH /api/visits/1/': { body: othersVisit },
    })
    renderWithProviders(<App />, { route: '/visits/1/edit' })
    await waitFor(() =>
      expect(screen.getByLabelText('Especialista')).toHaveDisplayValue('Carlos Peña'),
    )
    await waitFor(() => expect(screen.getByLabelText('Docente')).toHaveDisplayValue('Ana Rojas'))

    await userEvent.type(screen.getByLabelText('Observaciones'), ' Más notas.')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(calls.find((call) => call.method === 'PATCH')?.body).toMatchObject({ specialist_id: 2 })
  })

  it('moves the visit to another specialist', async () => {
    const { calls } = mockApi({
      ...adminRoutes,
      'GET /api/visits/1/': { body: othersVisit },
      'PATCH /api/visits/1/': { body: visitWire() },
    })
    renderWithProviders(<App />, { route: '/visits/1/edit' })
    await waitFor(() => expect(screen.getByLabelText('Docente')).toHaveDisplayValue('Ana Rojas'))

    await chooseSpecialist('María González')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()
    expect(calls.find((call) => call.method === 'PATCH')?.body).toMatchObject({ specialist_id: 1 })
  })

  it('deletes a visit of another specialist and goes back to the list', async () => {
    const { calls } = mockApi({
      ...adminRoutes,
      'GET /api/visits/1/': { body: othersVisit },
      'DELETE /api/visits/1/': { status: 204 },
      'GET /api/visits/?page=1&page_size=10': { body: pageWire([]) },
    })
    renderWithProviders(<App />, { route: '/visits/1' })

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar visita' }))

    expect(await screen.findByText('Visita eliminada.')).toBeInTheDocument()
    expect(calls.some((call) => call.method === 'DELETE' && call.path === '/api/visits/1/')).toBe(
      true,
    )
  })

  it('shows every visit in the list', async () => {
    mockApi({
      ...adminRoutes,
      'GET /api/visits/?page=1&page_size=10': { body: pageWire([visitWire(), othersVisit]) },
    })

    renderWithProviders(<App />, { route: '/visits' })

    const table = await screen.findByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(3)
  })
})
