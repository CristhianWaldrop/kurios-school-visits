import type { CurrentUser, Visit } from '../../api/types'

export function canManageVisit(user: CurrentUser | null, visit: Visit): boolean {
  if (!user) return false
  return user.role === 'admin' || user.specialistId === visit.specialist.id
}
