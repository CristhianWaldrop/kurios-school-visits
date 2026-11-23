import { adminWire, specialistWire } from '../test/fixtures'
import { mockApi } from '../test/mockApi'
import { fetchCsrfCookie, fetchCurrentUser, login, logout } from './auth'
import { ApiError } from './httpClient'

describe('auth api', () => {
  it('asks the server to set the CSRF cookie', async () => {
    const { calls } = mockApi({ 'GET /api/auth/csrf/': { status: 204 } })

    await fetchCsrfCookie()

    expect(calls).toEqual([{ method: 'GET', path: '/api/auth/csrf/', body: undefined }])
  })

  it('logs in with the credentials and maps a specialist', async () => {
    const { calls } = mockApi({ 'POST /api/auth/login/': { body: specialistWire } })

    const user = await login({ username: 'maria.gonzalez', password: 'demo1234' })

    expect(calls[0]?.body).toEqual({ username: 'maria.gonzalez', password: 'demo1234' })
    expect(user).toEqual({
      id: 11,
      username: 'maria.gonzalez',
      firstName: 'María',
      lastName: 'González',
      fullName: 'María González',
      email: 'maria.gonzalez@example.com',
      role: 'specialist',
      specialistId: 1,
      specialty: 'Matemáticas',
    })
  })

  it('maps an administrator, who has no specialist profile', async () => {
    mockApi({ 'POST /api/auth/login/': { body: adminWire } })

    const user = await login({ username: 'admin', password: 'admin12345' })

    expect(user).toMatchObject({
      role: 'admin',
      specialistId: null,
      specialty: '',
      fullName: 'admin',
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

  describe('fetchCurrentUser', () => {
    it('returns the mapped user when there is a session', async () => {
      mockApi({ 'GET /api/auth/me/': { body: specialistWire } })

      await expect(fetchCurrentUser()).resolves.toMatchObject({
        fullName: 'María González',
        role: 'specialist',
      })
    })

    it('returns an administrator as such', async () => {
      mockApi({ 'GET /api/auth/me/': { body: adminWire } })

      await expect(fetchCurrentUser()).resolves.toMatchObject({ role: 'admin', specialistId: null })
    })

    it.each([401, 403])('returns null when the server answers %i', async (status) => {
      mockApi({ 'GET /api/auth/me/': { status, body: { detail: 'x' } } })

      await expect(fetchCurrentUser()).resolves.toBeNull()
    })

    it('rethrows server failures', async () => {
      mockApi({ 'GET /api/auth/me/': { status: 500, body: {} } })

      await expect(fetchCurrentUser()).rejects.toMatchObject({ status: 500 })
    })

    it('rethrows network failures', async () => {
      mockApi({
        'GET /api/auth/me/': () => {
          throw new TypeError('Failed to fetch')
        },
      })

      await expect(fetchCurrentUser()).rejects.toBeInstanceOf(TypeError)
    })
  })
})
