import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { useVisitId } from './useVisitId'

function renderAt(path: string) {
  function wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/visits/:visitId" element={children} />
        </Routes>
      </MemoryRouter>
    )
  }
  return renderHook(() => useVisitId(), { wrapper })
}

describe('useVisitId', () => {
  it('returns the id of the visit in the address', () => {
    expect(renderAt('/visits/42').result.current).toBe(42)
  })

  it.each(['abc', '0', '-3', '1.5'])('returns null for "%s"', (value) => {
    expect(renderAt(`/visits/${value}`).result.current).toBeNull()
  })
})
