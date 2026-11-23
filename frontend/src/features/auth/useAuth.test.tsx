import { renderHook } from '@testing-library/react'

import { useAuth } from './useAuth'

describe('useAuth', () => {
  it('fails loudly when used outside an AuthProvider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used within an AuthProvider')
  })
})
