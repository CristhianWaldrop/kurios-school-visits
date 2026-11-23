import type { CurrentUser, Visit } from '../../api/types'
import { canManageVisit } from './visitPermissions'

function buildUser(overrides: Partial<CurrentUser> = {}): CurrentUser {
  return {
    id: 11,
    username: 'maria.gonzalez',
    firstName: 'María',
    lastName: 'González',
    fullName: 'María González',
    email: 'maria@example.com',
    role: 'specialist',
    specialistId: 1,
    specialty: 'Matemáticas',
    ...overrides,
  }
}

function buildVisit(specialistId: number): Visit {
  return {
    id: 1,
    school: { id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' },
    teacher: { id: 1, schoolId: 1, firstName: 'Ana', lastName: 'Rojas', fullName: 'Ana Rojas' },
    specialist: { id: specialistId, fullName: 'Alguien' },
    visitDate: '2026-11-20',
    visitType: 'meeting',
    observations: 'Notas',
    createdAt: '2026-11-22T18:15:00-04:00',
    updatedAt: '2026-11-22T18:15:00-04:00',
  }
}

describe('canManageVisit', () => {
  it('lets a specialist manage their own visits', () => {
    expect(canManageVisit(buildUser({ specialistId: 1 }), buildVisit(1))).toBe(true)
  })

  it('does not let a specialist manage the visits of others', () => {
    expect(canManageVisit(buildUser({ specialistId: 1 }), buildVisit(2))).toBe(false)
  })

  it('lets an administrator manage any visit', () => {
    const admin = buildUser({ role: 'admin', specialistId: null })

    expect(canManageVisit(admin, buildVisit(1))).toBe(true)
    expect(canManageVisit(admin, buildVisit(99))).toBe(true)
  })

  it('does not compare the user id with the specialist id', () => {
    expect(canManageVisit(buildUser({ id: 2, specialistId: 1 }), buildVisit(2))).toBe(false)
  })

  it('does not let anyone without a session manage visits', () => {
    expect(canManageVisit(null, buildVisit(1))).toBe(false)
  })
})
