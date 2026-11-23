import { QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'

import { createQueryClient } from '../app/queryClient'
import { AuthProvider } from '../features/auth/AuthProvider'

interface RenderOptions {
  route?: string
  state?: unknown
}

export function renderWithProviders(ui: ReactElement, { route = '/', state }: RenderOptions = {}) {
  const queryClient = createQueryClient({ retry: false })
  const [pathname = '/', search = ''] = route.split('?')

  const result = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[{ pathname, search: search ? `?${search}` : '', state }]}>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  return { ...result, queryClient }
}
