import { useQuery } from '@tanstack/react-query'

import { apiRequest } from '../../api/httpClient'

interface HealthResponse {
  status: string
}

export function useApiHealth() {
  return useQuery({
    queryKey: ['health'],
    queryFn: ({ signal }) => apiRequest<HealthResponse>('/health/', { signal }),
    retry: false,
  })
}
