import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from '../../app/App'
import { pageWire, specialistWire, visitWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { renderWithProviders } from '../../test/renderWithProviders'

const baseRoutes = {
  'GET /api/auth/me/': { body: specialistWire },
  'GET /api/schools/': { body: [] },
}

const DETAIL = 'GET /api/visits/1/'

describe('VisitDetailPage', () => {
  it('shows every piece of data of the visit in Spanish', async () => {
    mockApi({ ...baseRoutes, [DETAIL]: { body: visitWire() } })

    renderWithProviders(<App />, { route: '/visits/1' })

    expect(await screen.findByRole('heading', { name: 'Detalle de la visita' })).toBeInTheDocument()
    expect(screen.getByText('Registrada por María González')).toBeInTheDocument()
    expect(screen.getByText('20 de noviembre de 2026')).toBeInTheDocument()
    expect(screen.getByText('Visita en aula')).toBeInTheDocument()
    expect(screen.getByText('Colegio San Rafael (Maracaibo)')).toBeInTheDocument()
    expect(screen.getByText('Ana Rojas')).toBeInTheDocument()
    expect(screen.getByText('Repaso de fracciones con trabajo en parejas.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al listado' })).toHaveAttribute(
      'href',
      '/visits',
    )
  })

  it('lets the author edit and delete the visit', async () => {
    mockApi({ ...baseRoutes, [DETAIL]: { body: visitWire() } })

    renderWithProviders(<App />, { route: '/visits/1' })

    expect(await screen.findByRole('link', { name: 'Editar' })).toHaveAttribute(
      'href',
      '/visits/1/edit',
    )
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
    expect(screen.queryByText(/Solo quien registró la visita/)).not.toBeInTheDocument()
  })

  it('does not offer to edit or delete a visit registered by someone else', async () => {
    mockApi({
      ...baseRoutes,
      [DETAIL]: { body: visitWire({ specialist: { id: 2, full_name: 'Carlos Peña' } }) },
    })

    renderWithProviders(<App />, { route: '/visits/1' })

    expect(await screen.findByText('Registrada por Carlos Peña')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument()
    expect(
      screen.getByText('Solo quien registró la visita puede editarla o eliminarla.'),
    ).toBeInTheDocument()
  })

  it('asks for confirmation and can be cancelled', async () => {
    const { calls } = mockApi({ ...baseRoutes, [DETAIL]: { body: visitWire() } })
    renderWithProviders(<App />, { route: '/visits/1' })

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))

    expect(screen.getByRole('alertdialog', { name: '¿Eliminar esta visita?' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Editar' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar' })).toBeInTheDocument()
    expect(calls.some((call) => call.method === 'DELETE')).toBe(false)
  })

  it('deletes the visit and goes back to the list with a notice', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      [DETAIL]: { body: visitWire() },
      'DELETE /api/visits/1/': { status: 204 },
      'GET /api/visits/?page=1&page_size=10': { body: pageWire([]) },
    })
    renderWithProviders(<App />, { route: '/visits/1' })

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar visita' }))

    expect(await screen.findByRole('heading', { name: 'Visitas' })).toBeInTheDocument()
    expect(screen.getByText('Visita eliminada.')).toBeInTheDocument()
    expect(calls.some((call) => call.method === 'DELETE' && call.path === '/api/visits/1/')).toBe(
      true,
    )
  })

  it('keeps the visit and explains the error when it cannot be deleted', async () => {
    mockApi({
      ...baseRoutes,
      [DETAIL]: { body: visitWire() },
      'DELETE /api/visits/1/': {
        status: 403,
        body: { detail: 'Only the specialist...', code: 'permission_denied' },
      },
    })
    renderWithProviders(<App />, { route: '/visits/1' })

    await userEvent.click(await screen.findByRole('button', { name: 'Eliminar' }))
    await userEvent.click(screen.getByRole('button', { name: 'Eliminar visita' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No tienes permiso para realizar esta acción.',
    )
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Eliminar visita' })).toBeEnabled()
  })

  it('shows the notice it was given after another action', async () => {
    mockApi({ ...baseRoutes, [DETAIL]: { body: visitWire() } })

    renderWithProviders(<App />, { route: '/visits/1', state: { notice: 'Visita registrada.' } })

    expect(await screen.findByText('Visita registrada.')).toBeInTheDocument()
  })

  it('lets the user close the notice', async () => {
    mockApi({ ...baseRoutes, [DETAIL]: { body: visitWire() } })
    renderWithProviders(<App />, { route: '/visits/1', state: { notice: 'Cambios guardados.' } })
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))

    expect(screen.queryByText('Cambios guardados.')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Detalle de la visita' })).toBeInTheDocument()
  })

  it('hides the previous notice while asking for confirmation', async () => {
    mockApi({ ...baseRoutes, [DETAIL]: { body: visitWire() } })
    renderWithProviders(<App />, { route: '/visits/1', state: { notice: 'Cambios guardados.' } })
    expect(await screen.findByText('Cambios guardados.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar' }))

    expect(screen.queryByText('Cambios guardados.')).not.toBeInTheDocument()
  })

  it('shows the not found page when the visit does not exist', async () => {
    mockApi({
      ...baseRoutes,
      'GET /api/visits/99/': { status: 404, body: { detail: 'Not found.', code: 'not_found' } },
    })

    renderWithProviders(<App />, { route: '/visits/99' })

    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
  })

  it('shows the not found page for an address that is not a visit number', async () => {
    mockApi(baseRoutes)

    renderWithProviders(<App />, { route: '/visits/abc' })

    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
  })

  it('shows an error and lets the user try again', async () => {
    let attempts = 0
    mockApi({
      ...baseRoutes,
      [DETAIL]: () => {
        attempts += 1
        return attempts === 1 ? { status: 500, body: {} } : { body: visitWire() }
      },
    })
    renderWithProviders(<App />, { route: '/visits/1' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByRole('heading', { name: 'Detalle de la visita' })).toBeInTheDocument()
  })
})
