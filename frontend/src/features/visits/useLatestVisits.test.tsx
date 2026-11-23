import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { createQueryClient } from '../../app/queryClient'
import { pageWire, visitWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { useLatestVisits } from './useLatestVisits'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useLatestVisits', () => {
  it('requests the three most recent visits and returns them mapped', async () => {
    const { calls } = mockApi({
      'GET /api/visits/?page_size=3': { body: pageWire([visitWire(), visitWire({ id: 2 })]) },
    })

    const { result } = renderHook(() => useLatestVisits(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(calls[0]?.path).toBe('/api/visits/?page_size=3')
    expect(result.current.data?.map((visit) => visit.id)).toEqual([1, 2])
    expect(result.current.data?.[0]?.visitDate).toBe('2026-11-20')
  })

  it('exposes the error when the request fails', async () => {
    mockApi({ 'GET /api/visits/?page_size=3': { status: 500, body: {} } })

    const { result } = renderHook(() => useLatestVisits(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})
