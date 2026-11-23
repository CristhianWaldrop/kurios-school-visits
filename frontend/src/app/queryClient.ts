import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'

import { ApiError } from '../api/httpClient'
import { authKeys } from '../features/auth/authKeys'

interface QueryClientOptions {
  retry?: boolean
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  const isClientError = error instanceof ApiError && error.status < 500
  return !isClientError && failureCount < 2
}

export function createQueryClient({ retry = true }: QueryClientOptions = {}): QueryClient {
  function dropSessionOnUnauthorized(error: unknown) {
    if (error instanceof ApiError && error.status === 401) {
      queryClient.setQueryData(authKeys.me, null)
    }
  }

  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({ onError: dropSessionOnUnauthorized }),
    mutationCache: new MutationCache({ onError: dropSessionOnUnauthorized }),
    defaultOptions: {
      queries: { refetchOnWindowFocus: false, retry: retry ? shouldRetry : false },
      mutations: { retry: false },
    },
  })

  return queryClient
}
