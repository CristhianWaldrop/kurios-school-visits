import type { VisitListParams } from '../../api/visits'

export const visitKeys = {
  all: ['visits'] as const,
  latest: ['visits', 'latest'] as const,
  list: (params: VisitListParams) => ['visits', 'list', params] as const,
  detail: (id: number) => ['visits', 'detail', id] as const,
}
