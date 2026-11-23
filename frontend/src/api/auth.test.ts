import { mockApi } from '../test/mockApi'
import { specialistWire } from '../test/fixtures'
import { fetchCsrfCookie, fetchCurrentSpecialist, login, logout } from './auth'
import { ApiError } from './httpClient'

describe('auth api', () => {
  it('asks the server to set the CSRF cookie', async () => {
    const { calls } = mockApi({ 'GET /api/auth/csrf/': { status: 204 } })

    await fetchCsrfCookie()

    expect(calls).toEqual([{ method: 'GET', path: '/api/auth/csrf/', body: undefined }])
  })

  it('logs in with the credentials and maps the specialist', async () => {
    const { calls } = mockApi({ 'POST /api/auth/login/': { body: specialistWire } })

    const specialist = await login({ username: 'maria.gonzalez', password: 'demo1234' })

    expect(calls[0]?.body).toEqual({ username: 'maria.gonzalez', password: 'demo1234' })
    expect(specialist).toEqual({
      id: 1,
      username: 'maria.gonzalez',
      firstName: 'María',
      lastName: 'González',
      fullName: 'María González',
      email: 'maria.gonzalez@example.com',
      specialty: 'Matemáticas',
    })
  })

  it('rejects the login with an ApiError when the credentials are wrong', async () => {
    mockApi({
      'POST /api/auth/login/': { status: 401, body: { detail: 'x', code: 'invalid_credentials' } },
    })

    await expect(login({ username: 'a', password: 'b' })).rejects.toBeInstanceOf(ApiError)
  })

  it('logs out with a POST request', async () => {
    const { calls } = mockApi({ 'POST /api/auth/logout/': { status: 204 } })

    await expect(logout()).resolves.toBeUndefined()
    expect(calls[0]?.method).toBe('POST')
  })

  describe('fetchCurrentSpecialist', () => {
    it('returns the mapped specialist when there is a session', async () => {
      mockApi({ 'GET /api/auth/me/': { body: specialistWire } })

      await expect(fetchCurrentSpecialist()).resolves.toMatchObject({ fullName: 'María González' })
    })

    it.each([401, 403])('returns null when the server answers %i', async (status) => {
      mockApi({ 'GET /api/auth/me/': { status, body: { detail: 'x' } } })

      await expect(fetchCurrentSpecialist()).resolves.toBeNull()
    })

    it('rethrows server failures', async () => {
      mockApi({ 'GET /api/auth/me/': { status: 500, body: {} } })

      await expect(fetchCurrentSpecialist()).rejects.toMatchObject({ status: 500 })
    })

    it('rethrows network failures', async () => {
      mockApi({
        'GET /api/auth/me/': () => {
          throw new TypeError('Failed to fetch')
        },
      })

      await expect(fetchCurrentSpecialist()).rejects.toBeInstanceOf(TypeError)
    })
  })
})
