import type { VisitType } from '../../api/types'
import { isVisitType } from './visitTypes'

export interface VisitFilters {
  schoolId?: number
  visitType?: VisitType
  dateFrom?: string
  dateTo?: string
  search?: string
  page: number
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

function parsePositiveInteger(value: string | null): number | undefined {
  if (value === null) return undefined
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function parseIsoDate(value: string | null): string | undefined {
  return value !== null && ISO_DATE.test(value) ? value : undefined
}

export function parseVisitFilters(params: URLSearchParams): VisitFilters {
  const type = params.get('type')
  return {
    schoolId: parsePositiveInteger(params.get('school')),
    visitType: isVisitType(type) ? type : undefined,
    dateFrom: parseIsoDate(params.get('from')),
    dateTo: parseIsoDate(params.get('to')),
    search: params.get('q') || undefined,
    page: parsePositiveInteger(params.get('page')) ?? 1,
  }
}

export function serializeVisitFilters(filters: VisitFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.schoolId !== undefined) params.set('school', String(filters.schoolId))
  if (filters.visitType !== undefined) params.set('type', filters.visitType)
  if (filters.dateFrom !== undefined) params.set('from', filters.dateFrom)
  if (filters.dateTo !== undefined) params.set('to', filters.dateTo)
  if (filters.search) params.set('q', filters.search)
  if (filters.page > 1) params.set('page', String(filters.page))
  return params
}

export function hasActiveFilters(filters: VisitFilters): boolean {
  return (
    filters.schoolId !== undefined ||
    filters.visitType !== undefined ||
    filters.dateFrom !== undefined ||
    filters.dateTo !== undefined ||
    Boolean(filters.search?.trim())
  )
}
