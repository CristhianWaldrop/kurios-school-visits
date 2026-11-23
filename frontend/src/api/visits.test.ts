import { mockApi } from '../test/mockApi'
import { pageWire, visitWire } from '../test/fixtures'
import { ApiError } from './httpClient'
import type { VisitInput } from './types'
import { createVisit, deleteVisit, getVisit, listVisits, updateVisit } from './visits'

const input: VisitInput = {
  schoolId: 1,
  teacherId: 2,
  visitDate: '2026-11-20',
  visitType: 'meeting',
  observations: 'Planificación del lapso.',
}

describe('visits api', () => {
  describe('listVisits', () => {
    it('maps the page and its visits', async () => {
      mockApi({
        'GET /api/visits/': { body: pageWire([visitWire()], { next: 'http://x/?page=2' }) },
      })

      const page = await listVisits()

      expect(page).toMatchObject({ count: 1, hasNext: true, hasPrevious: false })
      expect(page.results[0]).toEqual({
        id: 1,
        school: { id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' },
        teacher: { id: 1, schoolId: 1, firstName: 'Ana', lastName: 'Rojas', fullName: 'Ana Rojas' },
        specialist: { id: 1, fullName: 'María González' },
        visitDate: '2026-11-20',
        visitType: 'classroom_visit',
        observations: 'Repaso de fracciones con trabajo en parejas.',
        createdAt: '2026-11-22T18:15:00-04:00',
        updatedAt: '2026-11-22T18:15:00-04:00',
      })
    })

    it('sends no query string when there are no filters', async () => {
      const { calls } = mockApi({ 'GET /api/visits/': { body: pageWire([]) } })

      await listVisits()

      expect(calls[0]?.path).toBe('/api/visits/')
    })

    it('translates every filter and pagination option', async () => {
      const { calls } = mockApi({ 'GET *': { body: pageWire([]) } })

      await listVisits({
        page: 2,
        pageSize: 5,
        schoolId: 3,
        visitType: 'meeting',
        dateFrom: '2026-11-01',
        dateTo: '2026-11-30',
        search: 'ana rojas',
      })

      expect(calls[0]?.path).toBe(
        '/api/visits/?page=2&page_size=5&school=3&visit_type=meeting' +
          '&date_from=2026-11-01&date_to=2026-11-30&search=ana+rojas',
      )
    })

    it('encodes special characters in the search', async () => {
      const { calls } = mockApi({ 'GET *': { body: pageWire([]) } })

      await listVisits({ search: 'Núñez & 100%' })

      expect(calls[0]?.path).toBe('/api/visits/?search=N%C3%BA%C3%B1ez+%26+100%25')
    })

    it('flags a previous page', async () => {
      mockApi({ 'GET *': { body: pageWire([], { previous: 'http://x/?page=1' }) } })

      await expect(listVisits({ page: 2 })).resolves.toMatchObject({ hasPrevious: true })
    })
  })

  it('gets a visit by id', async () => {
    mockApi({ 'GET /api/visits/7/': { body: visitWire({ id: 7 }) } })

    await expect(getVisit(7)).resolves.toMatchObject({ id: 7 })
  })

  it('creates a visit sending identifiers in the wire format', async () => {
    const { calls } = mockApi({ 'POST /api/visits/': { status: 201, body: visitWire() } })

    await createVisit(input)

    expect(calls[0]?.body).toEqual({
      school_id: 1,
      teacher_id: 2,
      visit_date: '2026-11-20',
      visit_type: 'meeting',
      observations: 'Planificación del lapso.',
    })
  })

  it('sends the specialist only when one is given', async () => {
    const { calls } = mockApi({ 'POST /api/visits/': { status: 201, body: visitWire() } })

    await createVisit(input)
    await createVisit({ ...input, specialistId: 4 })

    expect(calls[0]?.body).not.toHaveProperty('specialist_id')
    expect(calls[1]?.body).toMatchObject({ specialist_id: 4 })
  })

  it('updates a visit with PATCH', async () => {
    const { calls } = mockApi({ 'PATCH /api/visits/7/': { body: visitWire({ id: 7 }) } })

    await expect(updateVisit(7, input)).resolves.toMatchObject({ id: 7 })
    expect(calls[0]?.body).toMatchObject({ school_id: 1, teacher_id: 2 })
  })

  it('deletes a visit', async () => {
    const { calls } = mockApi({ 'DELETE /api/visits/7/': { status: 204 } })

    await expect(deleteVisit(7)).resolves.toBeUndefined()
    expect(calls[0]?.method).toBe('DELETE')
  })

  it('propagates validation errors as ApiError', async () => {
    mockApi({ 'POST /api/visits/': { status: 400, body: { errors: {} } } })

    await expect(createVisit(input)).rejects.toBeInstanceOf(ApiError)
  })
})
