import { hasActiveFilters, parseVisitFilters, serializeVisitFilters } from './visitFilterParams'

function parse(query: string) {
  return parseVisitFilters(new URLSearchParams(query))
}

describe('parseVisitFilters', () => {
  it('defaults to the first page without filters', () => {
    expect(parse('')).toEqual({ schoolId: undefined, visitType: undefined, page: 1 })
  })

  it('reads every parameter', () => {
    expect(parse('school=3&type=meeting&page=2')).toEqual({
      schoolId: 3,
      visitType: 'meeting',
      page: 2,
    })
  })

  it.each([['abc'], ['0'], ['-4'], ['1.5'], ['']])('ignores the invalid school "%s"', (value) => {
    expect(parse(`school=${value}`).schoolId).toBeUndefined()
  })

  it.each([['abc'], ['0'], ['-1'], ['']])('falls back to page 1 for "%s"', (value) => {
    expect(parse(`page=${value}`).page).toBe(1)
  })

  it('ignores a visit type it does not know', () => {
    expect(parse('type=inspection').visitType).toBeUndefined()
  })
})

describe('serializeVisitFilters', () => {
  it('writes nothing for the default state', () => {
    expect(serializeVisitFilters({ page: 1 }).toString()).toBe('')
  })

  it('writes every active filter and the page', () => {
    const params = serializeVisitFilters({ schoolId: 3, visitType: 'meeting', page: 2 })

    expect(params.get('school')).toBe('3')
    expect(params.get('type')).toBe('meeting')
    expect(params.get('page')).toBe('2')
  })

  it('round-trips through parseVisitFilters', () => {
    const filters = { schoolId: 7, visitType: 'classroom_visit' as const, page: 4 }

    expect(parseVisitFilters(serializeVisitFilters(filters))).toEqual(filters)
  })
})

describe('hasActiveFilters', () => {
  it('is false when only the page is set', () => {
    expect(hasActiveFilters({ page: 3 })).toBe(false)
  })

  it.each([[{ schoolId: 1, page: 1 }], [{ visitType: 'meeting' as const, page: 1 }]])(
    'is true when a filter is set',
    (filters) => {
      expect(hasActiveFilters(filters)).toBe(true)
    },
  )
})
