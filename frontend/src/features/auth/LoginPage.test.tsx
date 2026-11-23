import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { App } from '../../app/App'
import { notAuthenticated, pageWire, specialistWire, visitWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { renderWithProviders } from '../../test/renderWithProviders'

const anonymousRoutes = {
  'GET /api/auth/me/': notAuthenticated,
  'GET /api/auth/csrf/': { status: 204 },
  'GET /api/visits/?page_size=3': { body: pageWire([visitWire()]) },
}

async function fillAndSubmit(username: string, password: string) {
  await userEvent.type(await screen.findByLabelText('Usuario'), username)
  await userEvent.type(screen.getByLabelText('Contraseña'), password)
  await userEvent.click(screen.getByRole('button', { name: 'Ingresar' }))
}

describe('LoginPage', () => {
  it('asks for both fields before contacting the server', async () => {
    const { calls } = mockApi(anonymousRoutes)
    renderWithProviders(<App />, { route: '/login' })

    await userEvent.click(await screen.findByRole('button', { name: 'Ingresar' }))

    expect(screen.getByText('Ingresa tu usuario.')).toBeInTheDocument()
    expect(screen.getByText('Ingresa tu contraseña.')).toBeInTheDocument()
    expect(calls.map((call) => call.path)).toEqual(['/api/auth/me/'])
  })

  it('signs in and lands on the home page', async () => {
    const { calls } = mockApi({
      ...anonymousRoutes,
      'POST /api/auth/login/': { body: specialistWire },
    })
    renderWithProviders(<App />, { route: '/login' })

    await fillAndSubmit('maria.gonzalez', 'demo1234')

    expect(await screen.findByRole('heading', { name: 'Hola, María' })).toBeInTheDocument()
    const requests = calls.map((call) => `${call.method} ${call.path}`)
    expect(requests).toContain('GET /api/auth/csrf/')
    expect(requests.indexOf('GET /api/auth/csrf/')).toBeLessThan(
      requests.indexOf('POST /api/auth/login/'),
    )
    expect(calls.find((call) => call.method === 'POST')?.body).toEqual({
      username: 'maria.gonzalez',
      password: 'demo1234',
    })
  })

  it('sends the user back to the page they asked for', async () => {
    mockApi({ ...anonymousRoutes, 'POST /api/auth/login/': { body: specialistWire } })
    renderWithProviders(<App />, { route: '/missing' })

    await fillAndSubmit('maria.gonzalez', 'demo1234')

    expect(await screen.findByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
  })

  it('explains that the credentials are wrong', async () => {
    mockApi({
      ...anonymousRoutes,
      'POST /api/auth/login/': {
        status: 401,
        body: { detail: 'Invalid username or password.', code: 'invalid_credentials' },
      },
    })
    renderWithProviders(<App />, { route: '/login' })

    await fillAndSubmit('maria.gonzalez', 'wrong')

    expect(await screen.findByRole('alert')).toHaveTextContent('Usuario o contraseña incorrectos.')
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled()
  })

  it('explains that the server cannot be reached', async () => {
    mockApi({
      ...anonymousRoutes,
      'POST /api/auth/login/': () => {
        throw new TypeError('Failed to fetch')
      },
    })
    renderWithProviders(<App />, { route: '/login' })

    await fillAndSubmit('maria.gonzalez', 'demo1234')

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo conectar con el servidor.',
    )
  })

  it('disables the button while the request is in flight', async () => {
    let finishLogin: () => void = () => {}
    mockApi({
      ...anonymousRoutes,
      'POST /api/auth/login/': () =>
        new Promise((resolve) => {
          finishLogin = () => resolve({ status: 401, body: { code: 'invalid_credentials' } })
        }),
    })
    renderWithProviders(<App />, { route: '/login' })

    await fillAndSubmit('maria.gonzalez', 'demo1234')

    expect(await screen.findByRole('button', { name: 'Ingresando…' })).toBeDisabled()

    finishLogin()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ingresar' })).toBeEnabled())
  })

  it('redirects to the home page when there is already a session', async () => {
    mockApi({ ...anonymousRoutes, 'GET /api/auth/me/': { body: specialistWire } })
    renderWithProviders(<App />, { route: '/login' })

    expect(await screen.findByRole('heading', { name: 'Hola, María' })).toBeInTheDocument()
  })
})
