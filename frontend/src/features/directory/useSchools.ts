import { useQuery } from '@tanstack/react-query'

import { listSchools } from '../../api/directory'
import { directoryKeys } from './queryKeys'

export function useSchools() {
  return useQuery({
    queryKey: directoryKeys.schools,
    queryFn: ({ signal }) => listSchools(signal),
    staleTime: 5 * 60 * 1000,
  })
}
