import { keepPreviousData, useQuery } from '@tanstack/react-query'

import { listVisits, type VisitListParams } from '../../api/visits'
import { visitKeys } from './queryKeys'

export function useVisits(params: VisitListParams) {
  return useQuery({
    queryKey: visitKeys.list(params),
    queryFn: ({ signal }) => listVisits(params, signal),
    placeholderData: keepPreviousData,
  })
}
