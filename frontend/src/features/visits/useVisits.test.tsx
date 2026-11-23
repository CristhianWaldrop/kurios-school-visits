import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { createQueryClient } from '../../app/queryClient'
import { pageWire, visitWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { useVisit } from './useVisit'
import { useVisits } from './useVisits'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useVisits', () => {
  it('requests the page with the given filters and returns the mapped page', async () => {
    const { calls } = mockApi({
      'GET /api/visits/?page=2&page_size=10&school=3&visit_type=meeting': {
        body: pageWire([visitWire()], { count: 11, previous: 'http://x/?page=1' }),
      },
    })

    const { result } = renderHook(
      () => useVisits({ page: 2, pageSize: 10, schoolId: 3, visitType: 'meeting' }),
      { wrapper },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(calls[0]?.path).toBe('/api/visits/?page=2&page_size=10&school=3&visit_type=meeting')
    expect(result.current.data).toMatchObject({ count: 11, hasPrevious: true, hasNext: false })
    expect(result.current.data?.results[0]?.school.name).toBe('Colegio San Rafael')
  })

  it('exposes the error when the request fails', async () => {
    mockApi({ 'GET /api/visits/?page=1': { status: 500, body: {} } })

    const { result } = renderHook(() => useVisits({ page: 1 }), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useVisit', () => {
  it('requests the visit by id', async () => {
    const { calls } = mockApi({ 'GET /api/visits/7/': { body: visitWire({ id: 7 }) } })

    const { result } = renderHook(() => useVisit(7), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(calls[0]?.path).toBe('/api/visits/7/')
    expect(result.current.data?.id).toBe(7)
  })

  it('exposes a not found error', async () => {
    mockApi({ 'GET /api/visits/9/': { status: 404, body: { code: 'not_found' } } })

    const { result } = renderHook(() => useVisit(9), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toMatchObject({ status: 404 })
  })
})
