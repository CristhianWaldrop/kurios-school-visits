import { screen } from '@testing-library/react'

import { renderWithProviders } from '../../test/renderWithProviders'
import { ApiStatus } from './ApiStatus'

describe('ApiStatus', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('shows the API as operational when the health check succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 })),
    )

    renderWithProviders(<ApiStatus />)

    expect(await screen.findByText('API operativa')).toBeInTheDocument()
  })

  it('shows the API as disconnected when the health check fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Network error')))

    renderWithProviders(<ApiStatus />)

    expect(await screen.findByText('API sin conexión')).toBeInTheDocument()
  })
})
