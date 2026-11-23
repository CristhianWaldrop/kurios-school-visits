import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { createQueryClient } from '../../app/queryClient'
import { specialistsWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { useSpecialists } from './useSpecialists'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useSpecialists', () => {
  it('does not request anything when it is disabled', () => {
    const { fetchMock } = mockApi({})

    const { result } = renderHook(() => useSpecialists(false), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the specialists with camelCase names when enabled', async () => {
    mockApi({ 'GET /api/specialists/': { body: specialistsWire } })

    const { result } = renderHook(() => useSpecialists(true), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { id: 1, fullName: 'María González' },
      { id: 2, fullName: 'Carlos Peña' },
    ])
  })

  it('exposes the error when the server refuses', async () => {
    mockApi({ 'GET /api/specialists/': { status: 403, body: { code: 'permission_denied' } } })

    const { result } = renderHook(() => useSpecialists(true), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
