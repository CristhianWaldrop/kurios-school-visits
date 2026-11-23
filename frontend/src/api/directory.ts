import { apiRequest } from './httpClient'
import type { School, SpecialistSummary, Teacher } from './types'

interface TeacherWire {
  id: number
  school: number
  first_name: string
  last_name: string
  full_name: string
}

export function toTeacher(wire: TeacherWire): Teacher {
  return {
    id: wire.id,
    schoolId: wire.school,
    firstName: wire.first_name,
    lastName: wire.last_name,
    fullName: wire.full_name,
  }
}

interface SpecialistSummaryWire {
  id: number
  full_name: string
}

export async function listSpecialists(signal?: AbortSignal): Promise<SpecialistSummary[]> {
  const wire = await apiRequest<SpecialistSummaryWire[]>('/specialists/', { signal })
  return wire.map((specialist) => ({ id: specialist.id, fullName: specialist.full_name }))
}

export function listSchools(signal?: AbortSignal): Promise<School[]> {
  return apiRequest<School[]>('/schools/', { signal })
}

export async function listTeachers(schoolId?: number, signal?: AbortSignal): Promise<Teacher[]> {
  const query = schoolId === undefined ? '' : `?school=${schoolId}`
  const wire = await apiRequest<TeacherWire[]>(`/teachers/${query}`, { signal })
  return wire.map(toTeacher)
}
