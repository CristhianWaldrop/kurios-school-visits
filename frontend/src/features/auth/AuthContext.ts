import { createContext } from 'react'

import type { Credentials } from '../../api/auth'
import type { CurrentUser } from '../../api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

export interface AuthContextValue {
  status: AuthStatus
  user: CurrentUser | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
