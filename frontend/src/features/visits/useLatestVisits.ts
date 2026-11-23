import { useQuery } from '@tanstack/react-query'

import { listVisits } from '../../api/visits'
import { visitKeys } from './queryKeys'

const LATEST_VISITS_COUNT = 3

export function useLatestVisits() {
  return useQuery({
    queryKey: visitKeys.latest,
    queryFn: ({ signal }) => listVisits({ pageSize: LATEST_VISITS_COUNT }, signal),
    select: (page) => page.results,
  })
}
