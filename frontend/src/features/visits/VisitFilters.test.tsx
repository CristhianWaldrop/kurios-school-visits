import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { VisitFilters } from './VisitFilters'

const schools = [
  { id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' },
  { id: 2, name: 'Colegio Santa Lucía', city: 'Caracas' },
]

function buildProps(overrides: Partial<Parameters<typeof VisitFilters>[0]> = {}) {
  return {
    schools,
    value: { page: 1 },
    onSearchChange: vi.fn(),
    onSchoolChange: vi.fn(),
    onVisitTypeChange: vi.fn(),
    onDateFromChange: vi.fn(),
    onDateToChange: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  }
}

function renderFilters(overrides: Partial<Parameters<typeof VisitFilters>[0]> = {}) {
  const props = buildProps(overrides)
  const view = render(<VisitFilters {...props} />)
  return { ...props, ...view }
}

describe('VisitFilters', () => {
  it('offers every school and visit type plus an option for all of them', () => {
    renderFilters()

    expect(screen.getByRole('option', { name: 'Todos los colegios' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Colegio San Rafael' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Colegio Santa Lucía' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Todos los tipos' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Visita en aula' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Encuentro' })).toBeInTheDocument()
  })

  it('reflects every active filter', () => {
    renderFilters({
      value: {
        schoolId: 2,
        visitType: 'meeting',
        dateFrom: '2026-11-01',
        dateTo: '2026-11-30',
        search: 'fracciones',
        page: 1,
      },
    })

    expect(screen.getByLabelText('Colegio')).toHaveDisplayValue('Colegio Santa Lucía')
    expect(screen.getByLabelText('Tipo de visita')).toHaveDisplayValue('Encuentro')
    expect(screen.getByLabelText('Desde')).toHaveValue('2026-11-01')
    expect(screen.getByLabelText('Hasta')).toHaveValue('2026-11-30')
    expect(screen.getByLabelText('Buscar')).toHaveValue('fracciones')
  })

  it('reports the chosen school as a number', async () => {
    const { onSchoolChange } = renderFilters()

    await userEvent.selectOptions(screen.getByLabelText('Colegio'), 'Colegio Santa Lucía')

    expect(onSchoolChange).toHaveBeenCalledWith(2)
  })

  it('reports that no school is selected', async () => {
    const { onSchoolChange } = renderFilters({ value: { schoolId: 1, page: 1 } })

    await userEvent.selectOptions(screen.getByLabelText('Colegio'), 'Todos los colegios')

    expect(onSchoolChange).toHaveBeenCalledWith(undefined)
  })

  it('reports the chosen visit type', async () => {
    const { onVisitTypeChange } = renderFilters()

    await userEvent.selectOptions(screen.getByLabelText('Tipo de visita'), 'Encuentro')

    expect(onVisitTypeChange).toHaveBeenCalledWith('meeting')
  })

  it('reports that no visit type is selected', async () => {
    const { onVisitTypeChange } = renderFilters({ value: { visitType: 'meeting', page: 1 } })

    await userEvent.selectOptions(screen.getByLabelText('Tipo de visita'), 'Todos los tipos')

    expect(onVisitTypeChange).toHaveBeenCalledWith(undefined)
  })

  describe('search', () => {
    it('explains what it looks into', () => {
      renderFilters()

      expect(screen.getByPlaceholderText('Observaciones, docente o colegio')).toBeInTheDocument()
    })

    it('reports what the user types', () => {
      const { onSearchChange } = renderFilters()

      fireEvent.change(screen.getByLabelText('Buscar'), { target: { value: 'ana rojas' } })

      expect(onSearchChange).toHaveBeenCalledWith('ana rojas')
    })

    it('does not submit the form when pressing Enter', () => {
      renderFilters()

      const notPrevented = fireEvent.submit(screen.getByRole('search', { name: 'Filtrar visitas' }))

      expect(notPrevented).toBe(false)
    })
  })

  describe('date range', () => {
    it('reports the chosen dates', () => {
      const { onDateFromChange, onDateToChange } = renderFilters()

      fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '2026-11-01' } })
      fireEvent.change(screen.getByLabelText('Hasta'), { target: { value: '2026-11-30' } })

      expect(onDateFromChange).toHaveBeenCalledWith('2026-11-01')
      expect(onDateToChange).toHaveBeenCalledWith('2026-11-30')
    })

    it('reports a cleared date as no date', () => {
      const { onDateFromChange } = renderFilters({ value: { dateFrom: '2026-11-01', page: 1 } })

      fireEvent.change(screen.getByLabelText('Desde'), { target: { value: '' } })

      expect(onDateFromChange).toHaveBeenCalledWith(undefined)
    })

    it('stops the user from choosing an inverted range', () => {
      renderFilters({ value: { dateFrom: '2026-11-10', dateTo: '2026-11-20', page: 1 } })

      expect(screen.getByLabelText('Desde')).toHaveAttribute('max', '2026-11-20')
      expect(screen.getByLabelText('Hasta')).toHaveAttribute('min', '2026-11-10')
    })
  })

  describe('clearing', () => {
    it('is not offered when no filter is active', () => {
      renderFilters()

      expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
    })

    it.each([
      ['a school', { schoolId: 1 }],
      ['a visit type', { visitType: 'meeting' as const }],
      ['a start date', { dateFrom: '2026-11-01' }],
      ['an end date', { dateTo: '2026-11-30' }],
      ['a search', { search: 'ana' }],
    ])('is offered when there is %s', async (_label, filter) => {
      const { onClear } = renderFilters({ value: { ...filter, page: 1 } })

      await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

      expect(onClear).toHaveBeenCalledOnce()
    })

    it('is not offered for a search made only of spaces', () => {
      renderFilters({ value: { search: '   ', page: 1 } })

      expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()
    })
  })
})
