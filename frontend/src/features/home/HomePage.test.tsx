import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { pageWire, specialistWire, visitWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { renderWithProviders } from '../../test/renderWithProviders'
import { HomePage } from './HomePage'

const VISITS_ROUTE = 'GET /api/visits/?page_size=3'

function renderHome() {
  return renderWithProviders(<HomePage />)
}

describe('HomePage', () => {
  it('greets the specialist by first name', async () => {
    mockApi({
      'GET /api/auth/me/': { body: specialistWire },
      [VISITS_ROUTE]: { body: pageWire([]) },
    })

    renderHome()

    expect(await screen.findByRole('heading', { name: 'Hola, María' })).toBeInTheDocument()
  })

  it('falls back to the username when the specialist has no first name', async () => {
    mockApi({
      'GET /api/auth/me/': { body: { ...specialistWire, first_name: '' } },
      [VISITS_ROUTE]: { body: pageWire([]) },
    })

    renderHome()

    expect(await screen.findByRole('heading', { name: 'Hola, maria.gonzalez' })).toBeInTheDocument()
  })

  it('offers the two main actions', async () => {
    mockApi({
      'GET /api/auth/me/': { body: specialistWire },
      [VISITS_ROUTE]: { body: pageWire([]) },
    })

    renderHome()

    expect(await screen.findByRole('link', { name: 'Registrar visita' })).toHaveAttribute(
      'href',
      '/visits/new',
    )
    expect(screen.getByRole('link', { name: 'Ver visitas' })).toHaveAttribute('href', '/visits')
  })

  it('shows a loading message while the visits arrive', async () => {
    mockApi({
      'GET /api/auth/me/': { body: specialistWire },
      [VISITS_ROUTE]: () => new Promise(() => {}),
    })

    renderHome()

    expect(await screen.findByRole('status')).toHaveTextContent('Cargando visitas…')
  })

  it('lists the latest visits', async () => {
    mockApi({
      'GET /api/auth/me/': { body: specialistWire },
      [VISITS_ROUTE]: {
        body: pageWire([
          visitWire(),
          visitWire({
            id: 2,
            visit_type: 'meeting',
            school: { id: 2, name: 'Colegio Santa Lucía', city: 'Caracas' },
          }),
        ]),
      },
    })

    renderHome()

    const section = await screen.findByRole('region', { name: 'Últimas visitas' })
    expect(await within(section).findByText('Colegio San Rafael')).toBeInTheDocument()
    expect(within(section).getByText('Colegio Santa Lucía')).toBeInTheDocument()
    expect(within(section).getByText('Encuentro')).toBeInTheDocument()
  })

  it('tells the user when there are no visits yet', async () => {
    mockApi({
      'GET /api/auth/me/': { body: specialistWire },
      [VISITS_ROUTE]: { body: pageWire([]) },
    })

    renderHome()

    expect(await screen.findByText('Todavía no hay visitas registradas.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('shows an error and lets the user try again', async () => {
    let attempts = 0
    mockApi({
      'GET /api/auth/me/': { body: specialistWire },
      [VISITS_ROUTE]: () => {
        attempts += 1
        return attempts === 1 ? { status: 500, body: {} } : { body: pageWire([visitWire()]) }
      },
    })

    renderHome()

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Ocurrió un error inesperado. Inténtalo de nuevo.',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

    expect(await screen.findByText('Colegio San Rafael')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
