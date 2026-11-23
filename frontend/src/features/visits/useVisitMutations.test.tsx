import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import type { VisitInput } from '../../api/types'
import { createQueryClient } from '../../app/queryClient'
import { pageWire, visitWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { visitKeys } from './queryKeys'
import { useCreateVisit, useDeleteVisit, useUpdateVisit } from './useVisitMutations'

const input: VisitInput = {
  schoolId: 1,
  teacherId: 1,
  visitDate: '2026-11-20',
  visitType: 'meeting',
  observations: 'Texto',
}

function setup() {
  const queryClient = createQueryClient({ retry: false })
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
  return { queryClient, wrapper }
}

function seedCaches(queryClient: QueryClient) {
  const page = { count: 1, hasNext: false, hasPrevious: false, results: [] }
  queryClient.setQueryData(visitKeys.list({ page: 1 }), page)
  queryClient.setQueryData(visitKeys.latest, page)
}

function isInvalidated(queryClient: QueryClient, key: readonly unknown[]) {
  return queryClient.getQueryState(key)?.isInvalidated
}

describe('useCreateVisit', () => {
  it('creates the visit, caches its detail and refreshes the lists', async () => {
    const { queryClient, wrapper } = setup()
    seedCaches(queryClient)
    mockApi({ 'POST /api/visits/': { status: 201, body: visitWire({ id: 9 }) } })

    const { result } = renderHook(() => useCreateVisit(), { wrapper })
    await result.current.mutateAsync(input)

    await waitFor(() =>
      expect(queryClient.getQueryData(visitKeys.detail(9))).toMatchObject({ id: 9 }),
    )
    expect(isInvalidated(queryClient, visitKeys.list({ page: 1 }))).toBe(true)
    expect(isInvalidated(queryClient, visitKeys.latest)).toBe(true)
  })

  it('keeps the detail it just cached instead of invalidating it', async () => {
    const { queryClient, wrapper } = setup()
    mockApi({ 'POST /api/visits/': { status: 201, body: visitWire({ id: 9 }) } })

    const { result } = renderHook(() => useCreateVisit(), { wrapper })
    await result.current.mutateAsync(input)

    expect(isInvalidated(queryClient, visitKeys.detail(9))).toBe(false)
  })

  it('rejects when the server refuses the visit', async () => {
    const { wrapper } = setup()
    mockApi({ 'POST /api/visits/': { status: 400, body: { errors: {} } } })

    const { result } = renderHook(() => useCreateVisit(), { wrapper })

    await expect(result.current.mutateAsync(input)).rejects.toMatchObject({ status: 400 })
  })
})

describe('useUpdateVisit', () => {
  it('replaces the cached detail and refreshes the lists', async () => {
    const { queryClient, wrapper } = setup()
    seedCaches(queryClient)
    queryClient.setQueryData(visitKeys.detail(7), { id: 7, observations: 'Viejo' })
    mockApi({
      'PATCH /api/visits/7/': { body: visitWire({ id: 7, observations: 'Nuevo' }) },
    })

    const { result } = renderHook(() => useUpdateVisit(7), { wrapper })
    await result.current.mutateAsync(input)

    await waitFor(() =>
      expect(queryClient.getQueryData(visitKeys.detail(7))).toMatchObject({
        observations: 'Nuevo',
      }),
    )
    expect(isInvalidated(queryClient, visitKeys.list({ page: 1 }))).toBe(true)
  })
})

describe('useDeleteVisit', () => {
  it('forgets the detail and refreshes the lists', async () => {
    const { queryClient, wrapper } = setup()
    seedCaches(queryClient)
    queryClient.setQueryData(visitKeys.detail(7), { id: 7 })
    mockApi({ 'DELETE /api/visits/7/': { status: 204 } })

    const { result } = renderHook(() => useDeleteVisit(), { wrapper })
    await result.current.mutateAsync(7)

    await waitFor(() => expect(queryClient.getQueryData(visitKeys.detail(7))).toBeUndefined())
    expect(isInvalidated(queryClient, visitKeys.list({ page: 1 }))).toBe(true)
    expect(isInvalidated(queryClient, visitKeys.latest)).toBe(true)
  })

  it('keeps everything when the server refuses to delete', async () => {
    const { queryClient, wrapper } = setup()
    queryClient.setQueryData(visitKeys.detail(7), { id: 7 })
    mockApi({ 'DELETE /api/visits/7/': { status: 403, body: { code: 'permission_denied' } } })

    const { result } = renderHook(() => useDeleteVisit(), { wrapper })

    await expect(result.current.mutateAsync(7)).rejects.toMatchObject({ status: 403 })
    expect(queryClient.getQueryData(visitKeys.detail(7))).toEqual({ id: 7 })
  })

  it('does not touch list pages it was not asked about', async () => {
    const { queryClient, wrapper } = setup()
    queryClient.setQueryData(visitKeys.detail(8), { id: 8 })
    mockApi({
      'DELETE /api/visits/7/': { status: 204 },
      'GET *': { body: pageWire([]) },
    })

    const { result } = renderHook(() => useDeleteVisit(), { wrapper })
    await result.current.mutateAsync(7)

    expect(queryClient.getQueryData(visitKeys.detail(8))).toEqual({ id: 8 })
  })
})
