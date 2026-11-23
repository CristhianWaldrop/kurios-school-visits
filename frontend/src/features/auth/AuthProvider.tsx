import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, type ReactNode } from 'react'

import {
  fetchCsrfCookie,
  fetchCurrentSpecialist,
  login,
  logout,
  type Credentials,
} from '../../api/auth'
import { AuthContext, type AuthContextValue, type AuthStatus } from './AuthContext'
import { authKeys } from './authKeys'

interface AuthProviderProps {
  children: ReactNode
}

function resolveStatus(isPending: boolean, isError: boolean, hasUser: boolean): AuthStatus {
  if (isPending) return 'loading'
  if (isError) return 'error'
  return hasUser ? 'authenticated' : 'anonymous'
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient()

  const meQuery = useQuery({
    queryKey: authKeys.me,
    queryFn: ({ signal }) => fetchCurrentSpecialist(signal),
    retry: false,
    staleTime: Infinity,
  })

  const loginMutation = useMutation({
    mutationFn: async (credentials: Credentials) => {
      await fetchCsrfCookie()
      return login(credentials)
    },
    onSuccess: (specialist) => queryClient.setQueryData(authKeys.me, specialist),
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== authKeys.me[0] })
      queryClient.setQueryData(authKeys.me, null)
    },
  })

  const { mutateAsync: loginAsync } = loginMutation
  const { mutateAsync: logoutAsync } = logoutMutation
  const { refetch } = meQuery
  const user = meQuery.data ?? null

  const value = useMemo<AuthContextValue>(
    () => ({
      status: resolveStatus(meQuery.isPending, meQuery.isError, user !== null),
      user,
      login: async (credentials) => {
        await loginAsync(credentials)
      },
      logout: logoutAsync,
      retry: () => {
        void refetch()
      },
    }),
    [meQuery.isPending, meQuery.isError, user, loginAsync, logoutAsync, refetch],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
