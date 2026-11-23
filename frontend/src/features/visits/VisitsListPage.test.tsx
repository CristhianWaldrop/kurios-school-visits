import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from '../../app/App'
import { pageWire, schoolsWire, specialistWire, visitWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { renderWithProviders } from '../../test/renderWithProviders'

const LIST = 'GET /api/visits/?page=1&page_size=10'

const baseRoutes = {
  'GET /api/auth/me/': { body: specialistWire },
  'GET /api/schools/': { body: schoolsWire },
}

const meeting = visitWire({
  id: 2,
  visit_type: 'meeting',
  school: { id: 2, name: 'Colegio Santa Lucía', city: 'Caracas' },
})

function requested(calls: { method: string; path: string }[]) {
  return calls.map((call) => `${call.method} ${call.path}`)
}

describe('VisitsListPage', () => {
  it('lists the visits with the total and the main action', async () => {
    mockApi({ ...baseRoutes, [LIST]: { body: pageWire([visitWire(), meeting]) } })

    renderWithProviders(<App />, { route: '/visits' })

    expect(await screen.findByRole('heading', { name: 'Visitas' })).toBeInTheDocument()
    expect(await screen.findByText('Colegio San Rafael', { selector: 'td' })).toBeInTheDocument()
    expect(screen.getByText('Colegio Santa Lucía', { selector: 'td' })).toBeInTheDocument()
    expect(screen.getByText('2 visitas')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar visita' })).toHaveAttribute(
      'href',
      '/visits/new',
    )
  })

  it('uses the singular for a single visit', async () => {
    mockApi({ ...baseRoutes, [LIST]: { body: pageWire([visitWire()]) } })

    renderWithProviders(<App />, { route: '/visits' })

    expect(await screen.findByText('1 visita')).toBeInTheDocument()
  })

  it('shows a loading message while the visits arrive', async () => {
    mockApi({ ...baseRoutes, [LIST]: () => new Promise(() => {}) })

    renderWithProviders(<App />, { route: '/visits' })

    expect(await screen.findByText('Cargando visitas…')).toBeInTheDocument()
  })

  it('invites to register the first visit when there are none', async () => {
    mockApi({ ...baseRoutes, [LIST]: { body: pageWire([]) } })

    renderWithProviders(<App />, { route: '/visits' })

    expect(await screen.findByText('Todavía no hay visitas registradas.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Registrar la primera visita' })).toHaveAttribute(
      'href',
      '/visits/new',
    )
  })

  it('shows a message and a way out when the filters match nothing', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      [`${LIST}&school=1`]: { body: pageWire([]) },
      [LIST]: { body: pageWire([visitWire()]) },
    })

    renderWithProviders(<App />, { route: '/visits?school=1' })

    expect(
      await screen.findByText('No hay visitas que coincidan con los filtros.'),
    ).toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: 'Limpiar filtros' })[0]!)

    expect(await screen.findByText('1 visita')).toBeInTheDocument()
    expect(requested(calls)).toContain(`${LIST}`)
  })

  it('reads the filters from the address and shows them in the selects', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      [`${LIST}&school=2&visit_type=meeting`]: { body: pageWire([meeting]) },
    })

    renderWithProviders(<App />, { route: '/visits?school=2&type=meeting' })

    await waitFor(() =>
      expect(screen.getByLabelText('Colegio')).toHaveDisplayValue('Colegio Santa Lucía'),
    )
    expect(screen.getByLabelText('Tipo de visita')).toHaveDisplayValue('Encuentro')
    expect(requested(calls)).toContain(`${LIST}&school=2&visit_type=meeting`)
  })

  it('filters by school', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      [LIST]: { body: pageWire([visitWire(), meeting]) },
      [`${LIST}&school=1`]: { body: pageWire([visitWire()]) },
    })
    renderWithProviders(<App />, { route: '/visits' })
    await screen.findByText('2 visitas')

    await userEvent.selectOptions(screen.getByLabelText('Colegio'), 'Colegio San Rafael')

    expect(await screen.findByText('1 visita')).toBeInTheDocument()
    expect(requested(calls)).toContain(`${LIST}&school=1`)
  })

  it('filters by visit type', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      [LIST]: { body: pageWire([visitWire(), meeting]) },
      [`${LIST}&visit_type=meeting`]: { body: pageWire([meeting]) },
    })
    renderWithProviders(<App />, { route: '/visits' })
    await screen.findByText('2 visitas')

    await userEvent.selectOptions(screen.getByLabelText('Tipo de visita'), 'Encuentro')

    expect(await screen.findByText('1 visita')).toBeInTheDocument()
    expect(requested(calls)).toContain(`${LIST}&visit_type=meeting`)
  })

  it('goes back to the first page when a filter changes', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      'GET /api/visits/?page=3&page_size=10': { body: pageWire([visitWire()], { count: 25 }) },
      [`${LIST}&visit_type=meeting`]: { body: pageWire([meeting]) },
    })
    renderWithProviders(<App />, { route: '/visits?page=3' })
    await screen.findByText('Página 3 de 3')

    await userEvent.selectOptions(screen.getByLabelText('Tipo de visita'), 'Encuentro')

    expect(await screen.findByText('1 visita')).toBeInTheDocument()
    expect(requested(calls)).toContain(`${LIST}&visit_type=meeting`)
  })

  it('moves through the pages', async () => {
    const { calls } = mockApi({
      ...baseRoutes,
      [LIST]: { body: pageWire([visitWire()], { count: 25, next: 'http://x/?page=2' }) },
      'GET /api/visits/?page=2&page_size=10': {
        body: pageWire([meeting], { count: 25, previous: 'http://x/?page=1' }),
      },
    })
    renderWithProviders(<App />, { route: '/visits' })

    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument()
    expect(screen.getByText('Colegio Santa Lucía', { selector: 'td' })).toBeInTheDocument()
    expect(requested(calls)).toContain('GET /api/visits/?page=2&page_size=10')
  })

  it('offers to go back to the first page when the requested page does not exist', async () => {
    mockApi({
      ...baseRoutes,
      'GET /api/visits/?page=9&page_size=10': {
        status: 404,
        body: { detail: 'Invalid page.', code: 'not_found' },
      },
      [LIST]: { body: pageWire([visitWire()]) },
    })
    renderWithProviders(<App />, { route: '/visits?page=9' })

    expect(await screen.findByRole('alert')).toHaveTextContent('No encontramos lo que buscas.')

    await userEvent.click(screen.getByRole('button', { name: 'Ir a la primera página' }))

    expect(await screen.findByText('1 visita')).toBeInTheDocument()
  })

  it('shows an error and lets the user try again', async () => {
    let attempts = 0
    mockApi({
      ...baseRoutes,
      [LIST]: () => {
        attempts += 1
        return attempts === 1 ? { status: 500, body: {} } : { body: pageWire([visitWire()]) }
      },
    })
    renderWithProviders(<App />, { route: '/visits' })

    expect(await screen.findByRole('alert')).toHaveTextContent('Ocurrió un error inesperado.')

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('1 visita')).toBeInTheDocument()
  })

  it('shows the notice it was given after another action', async () => {
    mockApi({ ...baseRoutes, [LIST]: { body: pageWire([visitWire()]) } })

    renderWithProviders(<App />, { route: '/visits', state: { notice: 'Visita eliminada.' } })

    expect(await screen.findByText('Visita eliminada.')).toBeInTheDocument()
  })

  it('lets the user close the notice without losing the filters', async () => {
    mockApi({
      ...baseRoutes,
      [`${LIST}&school=1`]: { body: pageWire([visitWire()]) },
    })
    renderWithProviders(<App />, {
      route: '/visits?school=1',
      state: { notice: 'Visita eliminada.' },
    })
    expect(await screen.findByText('Visita eliminada.')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))

    expect(screen.queryByText('Visita eliminada.')).not.toBeInTheDocument()
    await waitFor(() =>
      expect(screen.getByLabelText('Colegio')).toHaveDisplayValue('Colegio San Rafael'),
    )
  })

  it('opens the visit when its row is activated through the link', async () => {
    mockApi({
      ...baseRoutes,
      [LIST]: { body: pageWire([visitWire()]) },
      'GET /api/visits/1/': { body: visitWire() },
    })
    renderWithProviders(<App />, { route: '/visits' })

    const table = await screen.findByRole('table')
    await userEvent.click(within(table).getByRole('link', { name: '20 de noviembre de 2026' }))

    expect(await screen.findByRole('heading', { name: 'Detalle de la visita' })).toBeInTheDocument()
  })
})
