import { apiRequest } from './httpClient'
import type { School, Teacher } from './types'

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

export function listSchools(signal?: AbortSignal): Promise<School[]> {
  return apiRequest<School[]>('/schools/', { signal })
}

export async function listTeachers(schoolId?: number, signal?: AbortSignal): Promise<Teacher[]> {
  const query = schoolId === undefined ? '' : `?school=${schoolId}`
  const wire = await apiRequest<TeacherWire[]>(`/teachers/${query}`, { signal })
  return wire.map(toTeacher)
}
