import { useQuery } from '@tanstack/react-query'

import { listSpecialists } from '../../api/directory'
import { directoryKeys } from './queryKeys'

export function useSpecialists(enabled: boolean) {
  return useQuery({
    queryKey: directoryKeys.specialists,
    queryFn: ({ signal }) => listSpecialists(signal),
    enabled,
    staleTime: 5 * 60 * 1000,
  })
}
