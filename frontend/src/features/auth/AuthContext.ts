import { createContext } from 'react'

import type { Credentials } from '../../api/auth'
import type { Specialist } from '../../api/types'

export type AuthStatus = 'loading' | 'authenticated' | 'anonymous' | 'error'

export interface AuthContextValue {
  status: AuthStatus
  user: Specialist | null
  login: (credentials: Credentials) => Promise<void>
  logout: () => Promise<void>
  retry: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
