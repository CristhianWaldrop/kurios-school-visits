import { QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'

import { createQueryClient } from '../../app/queryClient'
import { schoolsWire, teacherWire } from '../../test/fixtures'
import { mockApi } from '../../test/mockApi'
import { useSchools } from './useSchools'
import { useTeachers } from './useTeachers'

function wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={createQueryClient({ retry: false })}>
      {children}
    </QueryClientProvider>
  )
}

describe('useSchools', () => {
  it('returns the schools', async () => {
    mockApi({ 'GET /api/schools/': { body: schoolsWire } })

    const { result } = renderHook(() => useSchools(), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(schoolsWire)
  })

  it('exposes the error when the request fails', async () => {
    mockApi({ 'GET /api/schools/': { status: 500, body: {} } })

    const { result } = renderHook(() => useSchools(), { wrapper })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useTeachers', () => {
  it('does not request anything until there is a school', () => {
    const { fetchMock } = mockApi({})

    const { result } = renderHook(() => useTeachers(undefined), { wrapper })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('requests the teachers of the school and maps them', async () => {
    const { calls } = mockApi({ 'GET /api/teachers/?school=1': { body: [teacherWire()] } })

    const { result } = renderHook(() => useTeachers(1), { wrapper })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(calls[0]?.path).toBe('/api/teachers/?school=1')
    expect(result.current.data?.[0]).toMatchObject({ fullName: 'Ana Rojas', schoolId: 1 })
  })

  it('requests again when the school changes', async () => {
    const { calls } = mockApi({
      'GET /api/teachers/?school=1': { body: [teacherWire()] },
      'GET /api/teachers/?school=2': { body: [teacherWire({ id: 5, school: 2 })] },
    })

    const { result, rerender } = renderHook(({ schoolId }) => useTeachers(schoolId), {
      wrapper,
      initialProps: { schoolId: 1 },
    })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    rerender({ schoolId: 2 })

    await waitFor(() => expect(result.current.data?.[0]?.id).toBe(5))
    expect(calls.map((call) => call.path)).toEqual([
      '/api/teachers/?school=1',
      '/api/teachers/?school=2',
    ])
  })
})
