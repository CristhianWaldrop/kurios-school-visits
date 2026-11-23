import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'

import type { Visit, VisitInput } from '../../api/types'
import { createVisit, deleteVisit, updateVisit } from '../../api/visits'
import { visitKeys } from './queryKeys'

function invalidateVisitLists(queryClient: QueryClient) {
  return queryClient.invalidateQueries({
    queryKey: visitKeys.all,
    predicate: (query) => query.queryKey[1] !== 'detail',
  })
}

export function useCreateVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: VisitInput) => createVisit(input),
    onSuccess: (visit: Visit) => {
      queryClient.setQueryData(visitKeys.detail(visit.id), visit)
      return invalidateVisitLists(queryClient)
    },
  })
}

export function useUpdateVisit(id: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: VisitInput) => updateVisit(id, input),
    onSuccess: (visit: Visit) => {
      queryClient.setQueryData(visitKeys.detail(id), visit)
      return invalidateVisitLists(queryClient)
    },
  })
}

export function useDeleteVisit() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: number) => deleteVisit(id),
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: visitKeys.detail(id) })
      return invalidateVisitLists(queryClient)
    },
  })
}
