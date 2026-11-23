import { formatVisitDate } from './formatDate'

describe('formatVisitDate', () => {
  it('writes the date in Spanish', () => {
    expect(formatVisitDate('2026-11-20')).toBe('20 de noviembre de 2026')
  })

  it('does not shift the day because of the time zone', () => {
    expect(formatVisitDate('2026-01-01')).toBe('1 de enero de 2026')
    expect(formatVisitDate('2026-12-31')).toBe('31 de diciembre de 2026')
  })
})
