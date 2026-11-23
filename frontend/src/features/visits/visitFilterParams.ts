import type { VisitType } from '../../api/types'
import { isVisitType } from './visitTypes'

export interface VisitFilters {
  schoolId?: number
  visitType?: VisitType
  page: number
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (value === null) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

export function parseVisitFilters(params: URLSearchParams): VisitFilters {
  const type = params.get('type')
  return {
    schoolId: parsePositiveInteger(params.get('school')),
    visitType: isVisitType(type) ? type : undefined,
    page: parsePositiveInteger(params.get('page')) ?? 1,
  }
}

export function serializeVisitFilters(filters: VisitFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.schoolId !== undefined) params.set('school', String(filters.schoolId))
  if (filters.visitType !== undefined) params.set('type', filters.visitType)
  if (filters.page > 1) params.set('page', String(filters.page))
  return params
}

export function hasActiveFilters(filters: VisitFilters): boolean {
  return filters.schoolId !== undefined || filters.visitType !== undefined
}
