import { toTeacher } from './directory'
import { apiRequest } from './httpClient'
import type {
  Page,
  School,
  SpecialistSummary,
  Teacher,
  Visit,
  VisitInput,
  VisitType,
} from './types'

interface VisitWire {
  id: number
  school: School
  teacher: {
    id: number
    school: number
    first_name: string
    last_name: string
    full_name: string
  }
  specialist: { id: number; full_name: string }
  visit_date: string
  visit_type: VisitType
  observations: string
  created_at: string
  updated_at: string
}

interface PageWire<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface VisitListParams {
  page?: number
  pageSize?: number
  schoolId?: number
  visitType?: VisitType
  dateFrom?: string
  dateTo?: string
  search?: string
}

function toVisit(wire: VisitWire): Visit {
  const teacher: Teacher = toTeacher(wire.teacher)
  const specialist: SpecialistSummary = {
    id: wire.specialist.id,
    fullName: wire.specialist.full_name,
  }
  return {
    id: wire.id,
    school: wire.school,
    teacher,
    specialist,
    visitDate: wire.visit_date,
    visitType: wire.visit_type,
    observations: wire.observations,
    createdAt: wire.created_at,
    updatedAt: wire.updated_at,
  }
}

function toWireInput(input: VisitInput) {
  return {
    school_id: input.schoolId,
    teacher_id: input.teacherId,
    ...(input.specialistId !== undefined && { specialist_id: input.specialistId }),
    visit_date: input.visitDate,
    visit_type: input.visitType,
    observations: input.observations,
  }
}

function toQueryString(params: VisitListParams): string {
  const query = new URLSearchParams()
  if (params.page !== undefined) query.set('page', String(params.page))
  if (params.pageSize !== undefined) query.set('page_size', String(params.pageSize))
  if (params.schoolId !== undefined) query.set('school', String(params.schoolId))
  if (params.visitType !== undefined) query.set('visit_type', params.visitType)
  if (params.dateFrom !== undefined) query.set('date_from', params.dateFrom)
  if (params.dateTo !== undefined) query.set('date_to', params.dateTo)
  if (params.search !== undefined) query.set('search', params.search)
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}

export async function listVisits(
  params: VisitListParams = {},
  signal?: AbortSignal,
): Promise<Page<Visit>> {
  const wire = await apiRequest<PageWire<VisitWire>>(`/visits/${toQueryString(params)}`, { signal })
  return {
    count: wire.count,
    hasNext: wire.next !== null,
    hasPrevious: wire.previous !== null,
    results: wire.results.map(toVisit),
  }
}

export async function getVisit(id: number, signal?: AbortSignal): Promise<Visit> {
  return toVisit(await apiRequest<VisitWire>(`/visits/${id}/`, { signal }))
}

export async function createVisit(input: VisitInput): Promise<Visit> {
  const wire = await apiRequest<VisitWire>('/visits/', {
    method: 'POST',
    body: toWireInput(input),
  })
  return toVisit(wire)
}

export async function updateVisit(id: number, input: VisitInput): Promise<Visit> {
  const wire = await apiRequest<VisitWire>(`/visits/${id}/`, {
    method: 'PATCH',
    body: toWireInput(input),
  })
  return toVisit(wire)
}

export async function deleteVisit(id: number): Promise<void> {
  await apiRequest<void>(`/visits/${id}/`, { method: 'DELETE' })
}
