import { useQuery } from '@tanstack/react-query'

import { getVisit } from '../../api/visits'
import { visitKeys } from './queryKeys'

export function useVisit(id: number) {
  return useQuery({
    queryKey: visitKeys.detail(id),
    queryFn: ({ signal }) => getVisit(id, signal),
  })
}
