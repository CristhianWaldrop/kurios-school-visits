import { mockApi } from '../test/mockApi'
import { listSchools, listSpecialists, listTeachers } from './directory'

const teacherWire = {
  id: 4,
  school: 2,
  first_name: 'Ana',
  last_name: 'Rojas',
  full_name: 'Ana Rojas',
}

describe('directory api', () => {
  it('lists the schools as they come from the server', async () => {
    const schools = [{ id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' }]
    mockApi({ 'GET /api/schools/': { body: schools } })

    await expect(listSchools()).resolves.toEqual(schools)
  })

  it('lists the specialists with their names in camelCase', async () => {
    mockApi({ 'GET /api/specialists/': { body: [{ id: 3, full_name: 'Lucía Mendoza' }] } })

    await expect(listSpecialists()).resolves.toEqual([{ id: 3, fullName: 'Lucía Mendoza' }])
  })

  it('lists every teacher and maps the school id', async () => {
    mockApi({ 'GET /api/teachers/': { body: [teacherWire] } })

    await expect(listTeachers()).resolves.toEqual([
      { id: 4, schoolId: 2, firstName: 'Ana', lastName: 'Rojas', fullName: 'Ana Rojas' },
    ])
  })

  it('filters the teachers by school', async () => {
    const { calls } = mockApi({ 'GET /api/teachers/?school=2': { body: [teacherWire] } })

    await listTeachers(2)

    expect(calls[0]?.path).toBe('/api/teachers/?school=2')
  })
})
