import { act, renderHook } from '@testing-library/react'

import { useDebouncedValue } from './useDebouncedValue'

describe('useDebouncedValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with the value it is given', () => {
    const { result } = renderHook(() => useDebouncedValue('ana', 400))

    expect(result.current).toBe('ana')
  })

  it('waits for the pause before following the value', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'an' })
    act(() => vi.advanceTimersByTime(399))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(1))
    expect(result.current).toBe('an')
  })

  it('restarts the wait while the value keeps changing', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 400), {
      initialProps: { value: 'a' },
    })

    rerender({ value: 'an' })
    act(() => vi.advanceTimersByTime(300))
    rerender({ value: 'ana' })
    act(() => vi.advanceTimersByTime(300))
    expect(result.current).toBe('a')

    act(() => vi.advanceTimersByTime(100))
    expect(result.current).toBe('ana')
  })
})
