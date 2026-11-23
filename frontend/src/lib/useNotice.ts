import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

interface NoticeState {
  notice?: string
}

export function noticeState(message: string): NoticeState {
  return { notice: message }
}

export function useNotice() {
  const location = useLocation()
  const navigate = useNavigate()
  const message = (location.state as NoticeState | null)?.notice ?? null

  const dismiss = useCallback(() => {
    navigate(
      { pathname: location.pathname, search: location.search, hash: location.hash },
      { replace: true, state: null },
    )
  }, [navigate, location.pathname, location.search, location.hash])

  return { message, dismiss }
}
