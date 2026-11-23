import { hasActiveFilters, parseVisitFilters, serializeVisitFilters } from './visitFilterParams'

function parse(query: string) {
  return parseVisitFilters(new URLSearchParams(query))
}

describe('parseVisitFilters', () => {
  it('defaults to the first page without filters', () => {
    expect(parse('')).toEqual({
      schoolId: undefined,
      visitType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      search: undefined,
      page: 1,
    })
  })

  it('reads every parameter', () => {
    expect(
      parse('school=3&type=meeting&from=2026-11-01&to=2026-11-30&q=ana%20rojas&page=2'),
    ).toEqual({
      schoolId: 3,
      visitType: 'meeting',
      dateFrom: '2026-11-01',
      dateTo: '2026-11-30',
      search: 'ana rojas',
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

  it.each([['20/11/2026'], ['2026-1-5'], ['hoy'], ['']])(
    'ignores the invalid date "%s"',
    (value) => {
      const filters = parse(`from=${encodeURIComponent(value)}&to=${encodeURIComponent(value)}`)

      expect(filters.dateFrom).toBeUndefined()
      expect(filters.dateTo).toBeUndefined()
    },
  )

  it('treats an empty search as no search', () => {
    expect(parse('q=').search).toBeUndefined()
  })
})

describe('serializeVisitFilters', () => {
  it('writes nothing for the default state', () => {
    expect(serializeVisitFilters({ page: 1 }).toString()).toBe('')
  })

  it('writes every active filter and the page', () => {
    const params = serializeVisitFilters({
      schoolId: 3,
      visitType: 'meeting',
      dateFrom: '2026-11-01',
      dateTo: '2026-11-30',
      search: 'ana',
      page: 2,
    })

    expect(params.get('school')).toBe('3')
    expect(params.get('type')).toBe('meeting')
    expect(params.get('from')).toBe('2026-11-01')
    expect(params.get('to')).toBe('2026-11-30')
    expect(params.get('q')).toBe('ana')
    expect(params.get('page')).toBe('2')
  })

  it('does not write an empty search', () => {
    expect(serializeVisitFilters({ search: '', page: 1 }).has('q')).toBe(false)
  })

  it('round-trips through parseVisitFilters', () => {
    const filters = {
      schoolId: 7,
      visitType: 'classroom_visit' as const,
      dateFrom: '2026-01-01',
      dateTo: '2026-12-31',
      search: 'Colegio San Rafael',
      page: 4,
    }

    expect(parseVisitFilters(serializeVisitFilters(filters))).toEqual(filters)
  })
})

describe('hasActiveFilters', () => {
  it('is false when only the page is set', () => {
    expect(hasActiveFilters({ page: 3 })).toBe(false)
  })

  it.each([
    [{ schoolId: 1, page: 1 }],
    [{ visitType: 'meeting' as const, page: 1 }],
    [{ dateFrom: '2026-11-01', page: 1 }],
    [{ dateTo: '2026-11-30', page: 1 }],
    [{ search: 'ana', page: 1 }],
  ])('is true when a filter is set', (filters) => {
    expect(hasActiveFilters(filters)).toBe(true)
  })

  it('ignores a search made only of spaces', () => {
    expect(hasActiveFilters({ search: '   ', page: 1 })).toBe(false)
  })
})
