import { fireEvent, screen, waitFor, within } from '@testing-library/react'
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

  describe('search and date range', () => {
    const ADVANCED = `${LIST}&date_from=2026-11-01&date_to=2026-11-30&search=ana+rojas`

    it('reads the search and the dates from the address and uses them', async () => {
      const { calls } = mockApi({ ...baseRoutes, [ADVANCED]: { body: pageWire([visitWire()]) } })

      renderWithProviders(<App />, {
        route: '/visits?q=ana%20rojas&from=2026-11-01&to=2026-11-30',
      })

      expect(await screen.findByText('1 visita')).toBeInTheDocument()
      expect(screen.getByLabelText('Buscar')).toHaveValue('ana rojas')
      expect(screen.getByLabelText('Desde')).toHaveValue('2026-11-01')
      expect(screen.getByLabelText('Hasta')).toHaveValue('2026-11-30')
      expect(requested(calls)).toContain(ADVANCED)
    })

    it('filters by date range', async () => {
      const { calls } = mockApi({
        ...baseRoutes,
        [LIST]: { body: pageWire([visitWire(), meeting]) },
        [`${LIST}&date_from=2026-11-10`]: { body: pageWire([visitWire()]) },
        [`${LIST}&date_from=2026-11-10&date_to=2026-11-20`]: { body: pageWire([]) },
      })
      renderWithProviders(<App />, { route: '/visits' })
      await screen.findByText('2 visitas')

      fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-10' } })
      expect(await screen.findByText('1 visita')).toBeInTheDocument()

      fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-20' } })
      expect(
        await screen.findByText('No hay visitas que coincidan con los filtros.'),
      ).toBeInTheDocument()
      expect(requested(calls)).toContain(`${LIST}&date_from=2026-11-10&date_to=2026-11-20`)
    })

    it('searches after a pause in typing', async () => {
      const { calls } = mockApi({
        ...baseRoutes,
        [LIST]: { body: pageWire([visitWire(), meeting]) },
        [`${LIST}&search=ana`]: { body: pageWire([visitWire()]) },
      })
      renderWithProviders(<App />, { route: '/visits' })
      await screen.findByText('2 visitas')

      fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'ana' } })

      expect(screen.getByLabelText('Buscar')).toHaveValue('ana')
      expect(requested(calls)).not.toContain(`${LIST}&search=ana`)
      expect(await screen.findByText('1 visita', {}, { timeout: 2000 })).toBeInTheDocument()
      expect(requested(calls)).toContain(`${LIST}&search=ana`)
    })

    it('sends a single request for a burst of typing', async () => {
      const { calls } = mockApi({
        ...baseRoutes,
        [LIST]: { body: pageWire([visitWire(), meeting]) },
        [`${LIST}&search=ana`]: { body: pageWire([visitWire()]) },
      })
      renderWithProviders(<App />, { route: '/visits' })
      await screen.findByText('2 visitas')

      for (const text of ['a', 'an', 'ana']) {
        fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: text } })
      }
      await screen.findByText('1 visita', {}, { timeout: 2000 })

      const searches = requested(calls).filter((request) => request.includes('search='))
      expect(searches).toEqual([`${LIST}&search=ana`])
    })

    it('goes back to the first page when the search changes', async () => {
      const { calls } = mockApi({
        ...baseRoutes,
        'GET /api/visits/?page=3&page_size=10': { body: pageWire([visitWire()], { count: 25 }) },
        [`${LIST}&search=ana`]: { body: pageWire([visitWire()]) },
      })
      renderWithProviders(<App />, { route: '/visits?page=3' })
      await screen.findByText('Página 3 de 3')

      fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'ana' } })

      expect(await screen.findByText('1 visita', {}, { timeout: 2000 })).toBeInTheDocument()
      expect(requested(calls)).toContain(`${LIST}&search=ana`)
    })

    it('ignores a search made only of spaces', async () => {
      const { calls } = mockApi({ ...baseRoutes, [LIST]: { body: pageWire([visitWire()]) } })

      renderWithProviders(<App />, { route: '/visits?q=%20%20' })

      expect(await screen.findByText('1 visita')).toBeInTheDocument()
      expect(requested(calls).some((request) => request.includes('search='))).toBe(false)
      expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
    })

    it('says so when the search matches nothing', async () => {
      mockApi({ ...baseRoutes, [`${LIST}&search=zzz`]: { body: pageWire([]) } })

      renderWithProviders(<App />, { route: '/visits?q=zzz' })

      expect(
        await screen.findByText(
          'No hay visitas que coincidan con los filtros.',
          {},
          { timeout: 2000 },
        ),
      ).toBeInTheDocument()
    })

    it('clears the search and the dates at once', async () => {
      const { calls } = mockApi({
        ...baseRoutes,
        [ADVANCED]: { body: pageWire([visitWire()]) },
        [LIST]: { body: pageWire([visitWire(), meeting]) },
      })
      renderWithProviders(<App />, {
        route: '/visits?q=ana%20rojas&from=2026-11-01&to=2026-11-30',
      })
      await screen.findByText('1 visita')

      await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

      expect(await screen.findByText('2 visitas')).toBeInTheDocument()
      expect(screen.getByLabelText('Buscar')).toHaveValue('')
      expect(screen.getByLabelText('Desde')).toHaveValue('')
      expect(screen.getByLabelText('Hasta')).toHaveValue('')
      expect(requested(calls).at(-1)).toBe(LIST)
    })

    it('explains in Spanish when the server rejects the date range', async () => {
      mockApi({
        ...baseRoutes,
        [`${LIST}&date_from=2026-11-30&date_to=2026-11-01`]: {
          status: 400,
          body: {
            detail: 'Invalid input.',
            errors: { __all__: [{ code: 'invalid_range', message: 'English text' }] },
          },
        },
      })

      renderWithProviders(<App />, { route: '/visits?from=2026-11-30&to=2026-11-01' })

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'La fecha «Desde» no puede ser posterior a «Hasta».',
      )
      expect(screen.queryByText('English text')).not.toBeInTheDocument()
    })
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
