import { screen } from '@testing-library/react'

import { renderWithProviders } from '../test/renderWithProviders'
import { App } from './App'

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ status: 'ok' }), { status: 200 })),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the application title', () => {
    renderWithProviders(<App />)

    expect(screen.getByRole('heading', { name: 'Registro de visitas' })).toBeInTheDocument()
  })
})
