import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { adminWire, notAuthenticated, pageWire, specialistWire, visitWire } from '../test/fixtures'
import { mockApi } from '../test/mockApi'
import { renderWithProviders } from '../test/renderWithProviders'
import { App } from './App'

const authenticatedRoutes = {
  'GET /api/auth/me/': { body: specialistWire },
  'GET /api/visits/?page_size=3': { body: pageWire([visitWire()]) },
}

describe('App', () => {
  describe('route protection', () => {
    it('sends visitors without a session to the login page', async () => {
      mockApi({ ...authenticatedRoutes, 'GET /api/auth/me/': notAuthenticated })

      renderWithProviders(<App />, { route: '/' })

      expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })

    it('treats a session without specialist profile as no session', async () => {
      mockApi({
        ...authenticatedRoutes,
        'GET /api/auth/me/': { status: 403, body: { code: 'permission_denied' } },
      })

      renderWithProviders(<App />, { route: '/' })

      expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })

    it('shows a loading message while the session is being checked', () => {
      mockApi({ 'GET /api/auth/me/': () => new Promise(() => {}) })

      renderWithProviders(<App />, { route: '/' })

      expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
    })

    it('lets the user retry when the session cannot be checked', async () => {
      let attempts = 0
      mockApi({
        ...authenticatedRoutes,
        'GET /api/auth/me/': () => {
          attempts += 1
          if (attempts === 1) throw new TypeError('Failed to fetch')
          return { body: specialistWire }
        },
      })
      renderWithProviders(<App />, { route: '/' })

      expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo verificar tu sesión.')

      await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }))

      expect(await screen.findByRole('heading', { name: 'Hola, María' })).toBeInTheDocument()
    })

    it('returns to the login page when the session expires', async () => {
      mockApi({
        ...authenticatedRoutes,
        'GET /api/visits/?page_size=3': notAuthenticated,
      })

      renderWithProviders(<App />, { route: '/' })

      expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
    })
  })

  describe('layout', () => {
    it('shows the navigation and the name of the specialist', async () => {
      mockApi(authenticatedRoutes)

      renderWithProviders(<App />, { route: '/' })

      const banner = await screen.findByRole('banner')
      expect(within(banner).getByText('María González')).toBeInTheDocument()
      const navigation = within(banner).getByRole('navigation', { name: 'Principal' })
      expect(within(navigation).getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
      expect(within(navigation).getByRole('link', { name: 'Visitas' })).toHaveAttribute(
        'href',
        '/visits',
      )
    })

    it('does not label a specialist as administrator', async () => {
      mockApi(authenticatedRoutes)

      renderWithProviders(<App />, { route: '/' })

      const banner = await screen.findByRole('banner')
      await within(banner).findByText('María González')
      expect(within(banner).queryByText('Administrador')).not.toBeInTheDocument()
    })

    it('labels an administrator as such', async () => {
      mockApi({ ...authenticatedRoutes, 'GET /api/auth/me/': { body: adminWire } })

      renderWithProviders(<App />, { route: '/' })

      const banner = await screen.findByRole('banner')
      expect(within(banner).getByText('admin')).toBeInTheDocument()
      expect(within(banner).getByText('Administrador')).toBeInTheDocument()
    })

    it('marks the current section in the navigation', async () => {
      mockApi(authenticatedRoutes)

      renderWithProviders(<App />, { route: '/' })

      expect(await screen.findByRole('link', { name: 'Inicio' })).toHaveAttribute(
        'aria-current',
        'page',
      )
      expect(screen.getByRole('link', { name: 'Visitas' })).not.toHaveAttribute('aria-current')
    })

    it('signs the specialist out and goes back to the login page', async () => {
      const { calls } = mockApi({
        ...authenticatedRoutes,
        'POST /api/auth/logout/': { status: 204 },
      })
      renderWithProviders(<App />, { route: '/' })

      await userEvent.click(await screen.findByRole('button', { name: 'Cerrar sesión' }))

      expect(await screen.findByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument()
      expect(
        calls.some((call) => call.method === 'POST' && call.path === '/api/auth/logout/'),
      ).toBe(true)
    })
  })

  it('shows a not found page inside the layout for unknown addresses', async () => {
    mockApi(authenticatedRoutes)

    renderWithProviders(<App />, { route: '/does-not-exist' })

    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })
})
