import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { VisitFilters } from './VisitFilters'

const schools = [
  { id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' },
  { id: 2, name: 'Colegio Santa Lucía', city: 'Caracas' },
]

function renderFilters(overrides: Partial<Parameters<typeof VisitFilters>[0]> = {}) {
  const props = {
    schools,
    value: { page: 1 },
    onSchoolChange: vi.fn(),
    onVisitTypeChange: vi.fn(),
    onClear: vi.fn(),
    ...overrides,
  }
  render(<VisitFilters {...props} />)
  return props
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

  it('reflects the active filters', () => {
    renderFilters({ value: { schoolId: 2, visitType: 'meeting', page: 1 } })

    expect(screen.getByLabelText('Colegio')).toHaveDisplayValue('Colegio Santa Lucía')
    expect(screen.getByLabelText('Tipo de visita')).toHaveDisplayValue('Encuentro')
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

  it('only offers to clear the filters when one is active', async () => {
    const { rerender } = render(
      <VisitFilters
        schools={schools}
        value={{ page: 1 }}
        onSchoolChange={vi.fn()}
        onVisitTypeChange={vi.fn()}
        onClear={vi.fn()}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Limpiar filtros' })).not.toBeInTheDocument()

    const onClear = vi.fn()
    rerender(
      <VisitFilters
        schools={schools}
        value={{ schoolId: 1, page: 1 }}
        onSchoolChange={vi.fn()}
        onVisitTypeChange={vi.fn()}
        onClear={onClear}
      />,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Limpiar filtros' }))

    expect(onClear).toHaveBeenCalledOnce()
  })
})
