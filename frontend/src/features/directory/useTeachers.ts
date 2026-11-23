import { useQuery } from '@tanstack/react-query'

import { listTeachers } from '../../api/directory'
import { directoryKeys } from './queryKeys'

export function useTeachers(schoolId: number | undefined) {
  return useQuery({
    queryKey: directoryKeys.teachers(schoolId),
    queryFn: ({ signal }) => listTeachers(schoolId, signal),
    enabled: schoolId !== undefined,
    staleTime: 5 * 60 * 1000,
  })
}
