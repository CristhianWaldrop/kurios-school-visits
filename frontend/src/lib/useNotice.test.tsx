import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, useLocation } from 'react-router-dom'

import { noticeState, useNotice } from './useNotice'

function renderWithState(state: unknown, path = { pathname: '/', search: '' }) {
  function wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[{ ...path, state }]}>{children}</MemoryRouter>
  }
  return renderHook(() => ({ notice: useNotice(), location: useLocation() }), { wrapper })
}

describe('useNotice', () => {
  it('returns the message passed through the navigation state', () => {
    const { result } = renderWithState(noticeState('Visita registrada.'))

    expect(result.current.notice.message).toBe('Visita registrada.')
  })

  it.each([[null], [undefined], [{}], [{ other: true }]])(
    'returns no message when there is none (%j)',
    (state) => {
      expect(renderWithState(state).result.current.notice.message).toBeNull()
    },
  )

  it('forgets the message when it is dismissed', () => {
    const { result } = renderWithState(noticeState('Visita eliminada.'))

    act(() => result.current.notice.dismiss())

    expect(result.current.notice.message).toBeNull()
    expect(result.current.location.state).toBeNull()
  })

  it('keeps the address when dismissing, including the filters', () => {
    const { result } = renderWithState(noticeState('Visita eliminada.'), {
      pathname: '/visits',
      search: '?school=1&page=2',
    })

    act(() => result.current.notice.dismiss())

    expect(result.current.location.pathname).toBe('/visits')
    expect(result.current.location.search).toBe('?school=1&page=2')
  })
})
