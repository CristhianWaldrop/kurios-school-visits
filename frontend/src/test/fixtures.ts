export const specialistWire = {
  id: 1,
  username: 'maria.gonzalez',
  first_name: 'María',
  last_name: 'González',
  full_name: 'María González',
  email: 'maria.gonzalez@example.com',
  specialty: 'Matemáticas',
}

export const notAuthenticated = {
  status: 401,
  body: { detail: 'Authentication credentials were not provided.', code: 'not_authenticated' },
}

export function visitWire(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    school: { id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' },
    teacher: { id: 1, school: 1, first_name: 'Ana', last_name: 'Rojas', full_name: 'Ana Rojas' },
    specialist: { id: 1, full_name: 'María González' },
    visit_date: '2026-11-20',
    visit_type: 'classroom_visit',
    observations: 'Repaso de fracciones con trabajo en parejas.',
    created_at: '2026-11-22T18:15:00-04:00',
    updated_at: '2026-11-22T18:15:00-04:00',
    ...overrides,
  }
}

export function pageWire(results: unknown[], overrides: Record<string, unknown> = {}) {
  return { count: results.length, next: null, previous: null, results, ...overrides }
}
