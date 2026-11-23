import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from '../../app/App'
import { schoolsWire, specialistWire, teacherWire, visitWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { renderWithProviders } from '../../test/renderWithProviders'

const baseRoutes = {
  'GET /api/auth/me/': { body: specialistWire },
  'GET /api/schools/': { body: schoolsWire },
  'GET /api/teachers/?school=1': { body: [teacherWire()] },
}

describe('EditVisitPage', () => {
  it('shows the form filled with the data of the visit', async () => {
    mockApi({ ...baseRoutes, 'GET /api/visits/1/': { body: visitWire() } })

    renderWithProviders(<App />, { route: '/visits/1/edit' })

    expect(await screen.findByRole('heading', { name: 'Editar visita' })).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByLabelText('Colegio')).toHaveDisplayValue('Colegio San Rafael'),
    )
    await waitFor(() => expect(screen.getByLabelText('Docente')).toHaveDisplayValue('Ana Rojas'))
    expect(screen.getByLabelText('Fecha de la visita')).toHaveValue('2026-11-20')
    expect(screen.getByLabelText('Tipo de visita')).toHaveDisplayValue('Visita en aula')
    expect(screen.getByLabelText('Observaciones')).toHaveValue(
      'Repaso de fracciones con trabajo en parejas.',
    )
    expect(screen.getByRole('link', { name: 'Cancelar' })).toHaveAttribute('href', '/visits/1')
  })

  it('saves the changes and shows the visit with a confirmation', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      'GET /api/visits/1/': { body: visitWire() },
      'PATCH /api/visits/1/': { body: visitWire({ observations: 'Texto nuevo' }) },
    })
    renderWithProviders(<App />, { route: '/visits/1/edit' })
    await waitFor(() => expect(screen.getByLabelText('Docente')).toHaveDisplayValue('Ana Rojas'))

    const observations = screen.getByLabelText('Observaciones')
    await userEvent.clear(observations)
    await userEvent.type(observations, '  Texto nuevo  ')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }))

    expect(await screen.findByRole('heading', { name: 'Detalle de la visita' })).toBeInTheDocument()
    expect(screen.getByText('Cambios guardados.')).toBeInTheDocument()
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({
      school_id: 1,
      teacher_id: 1,
      visit_date: '2026-11-20',
      visit_type: 'classroom_visit',
      observations: 'Texto nuevo',
    })
  })

  it('does not let another specialist edit the visit', async () => {
    mockApi({
      ...baseRoutes,
      'GET /api/visits/1/': {
        body: visitWire({ specialist: { id: 2, full_name: 'Carlos Peña' } }),
      },
    })

    renderWithProviders(<App />, { route: '/visits/1/edit' })

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Solo quien registró la visita puede modificarla.',
    )
    expect(screen.queryByLabelText('Observaciones')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al detalle' })).toHaveAttribute(
      'href',
      '/visits/1',
    )
  })

  it('shows the not found page when the visit does not exist', async () => {
    mockApi({
      ...baseRoutes,
      'GET /api/visits/99/': { status: 404, body: { detail: 'Not found.', code: 'not_found' } },
    })

    renderWithProviders(<App />, { route: '/visits/99/edit' })

    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
  })

  it('shows the not found page for an address that is not a visit number', async () => {
    mockApi(baseRoutes)

    renderWithProviders(<App />, { route: '/visits/abc/edit' })

    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
  })

  it('shows an error and lets the user try again', async () => {
    let attempts = 0
    mockApi({
      ...baseRoutes,
      'GET /api/visits/1/': () => {
        attempts += 1
        return attempts === 1 ? { status: 500, body: {} } : { body: visitWire() }
      },
    })
    renderWithProviders(<App />, { route: '/visits/1/edit' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Editar visita' })).toBeInTheDocument()
  })
})
