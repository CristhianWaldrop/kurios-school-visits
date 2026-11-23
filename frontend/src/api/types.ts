export type VisitType = 'classroom_visit' | 'meeting'

export type Role = 'admin' | 'specialist'

export interface CurrentUser {
  id: number
  username: string
  firstName: string
  lastName: string
  fullName: string
  email: string
  role: Role
  specialistId: number | null
  specialty: string
}

export interface SpecialistSummary {
  id: number
  fullName: string
}

export interface School {
  id: number
  name: string
  city: string
}

export interface Teacher {
  id: number
  schoolId: number
  firstName: string
  lastName: string
  fullName: string
}

export interface Visit {
  id: number
  school: School
  teacher: Teacher
  specialist: SpecialistSummary
  visitDate: string
  visitType: VisitType
  observations: string
  createdAt: string
  updatedAt: string
}

export interface VisitInput {
  schoolId: number
  teacherId: number
  specialistId?: number
  visitDate: string
  visitType: VisitType
  observations: string
}

export interface Page<T> {
  count: number
  hasNext: boolean
  hasPrevious: boolean
  results: T[]
}
