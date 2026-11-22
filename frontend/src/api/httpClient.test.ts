import { ApiError, apiRequest } from './httpClient'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status })
}

describe('apiRequest', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
    document.cookie = 'csrftoken=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the parsed JSON body on success', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ status: 'ok' }))

    await expect(apiRequest('/health/')).resolves.toEqual({ status: 'ok' })
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/health/',
      expect.objectContaining({ method: 'GET', credentials: 'same-origin' }),
    )
  })

  it('sends the CSRF token on unsafe methods', async () => {
    document.cookie = 'csrftoken=abc123'
    fetchMock.mockResolvedValue(jsonResponse({}, 201))

    await apiRequest('/visits/', { method: 'POST', body: { observations: 'Great class' } })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.headers).toMatchObject({
      'X-CSRFToken': 'abc123',
      'Content-Type': 'application/json',
    })
    expect(init.body).toBe(JSON.stringify({ observations: 'Great class' }))
  })

  it('does not send the CSRF token on safe methods', async () => {
    document.cookie = 'csrftoken=abc123'
    fetchMock.mockResolvedValue(jsonResponse({}))

    await apiRequest('/visits/')

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.headers).not.toHaveProperty('X-CSRFToken')
  })

  it('returns undefined for empty responses', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    await expect(apiRequest('/visits/1/', { method: 'DELETE' })).resolves.toBeUndefined()
  })

  it('throws an ApiError carrying status and body on failure', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ detail: 'Not authenticated' }, 403))

    await expect(apiRequest('/visits/')).rejects.toMatchObject({
      name: 'ApiError',
      status: 403,
      body: { detail: 'Not authenticated' },
    })
    await expect(apiRequest('/visits/')).rejects.toBeInstanceOf(ApiError)
  })
})
