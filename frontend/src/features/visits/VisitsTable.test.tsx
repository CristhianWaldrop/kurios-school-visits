import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import type { Visit } from '../../api/types'
import { VisitsTable } from './VisitsTable'

function buildVisit(overrides: Partial<Visit> = {}): Visit {
  return {
    id: 1,
    school: { id: 1, name: 'Colegio San Rafael', city: 'Maracaibo' },
    teacher: { id: 1, schoolId: 1, firstName: 'Ana', lastName: 'Rojas', fullName: 'Ana Rojas' },
    specialist: { id: 1, fullName: 'María González' },
    visitDate: '2026-11-20',
    visitType: 'classroom_visit',
    observations: 'Notas',
    createdAt: '2026-11-22T18:15:00-04:00',
    updatedAt: '2026-11-22T18:15:00-04:00',
    ...overrides,
  }
}

function renderTable(visits: Visit[]) {
  return render(
    <MemoryRouter>
      <VisitsTable visits={visits} />
    </MemoryRouter>,
  )
}

describe('VisitsTable', () => {
  it('names every column', () => {
    renderTable([buildVisit()])

    const headers = screen.getAllByRole('columnheader').map((header) => header.textContent)
    expect(headers).toEqual(['Fecha', 'Colegio', 'Docente', 'Tipo', 'Especialista'])
  })

  it('shows the data of each visit in Spanish', () => {
    renderTable([buildVisit()])

    const row = screen.getAllByRole('row')[1]!
    expect(within(row).getByText('Colegio San Rafael')).toBeInTheDocument()
    expect(within(row).getByText('Ana Rojas')).toBeInTheDocument()
    expect(within(row).getByText('Visita en aula')).toBeInTheDocument()
    expect(within(row).getByText('María González')).toBeInTheDocument()
  })

  it('links the formatted date to the visit detail', () => {
    renderTable([buildVisit({ id: 7 })])

    expect(screen.getByRole('link', { name: '20 de noviembre de 2026' })).toHaveAttribute(
      'href',
      '/visits/7',
    )
  })

  it('keeps a single link per row so the whole row can be activated through it', () => {
    renderTable([buildVisit({ id: 1 }), buildVisit({ id: 2 })])

    for (const row of screen.getAllByRole('row').slice(1)) {
      expect(within(row).getAllByRole('link')).toHaveLength(1)
    }
  })

  it('labels the meeting type', () => {
    renderTable([buildVisit({ visitType: 'meeting' })])

    expect(screen.getByText('Encuentro')).toBeInTheDocument()
  })

  it('renders one row per visit', () => {
    renderTable([buildVisit({ id: 1 }), buildVisit({ id: 2 }), buildVisit({ id: 3 })])

    expect(screen.getAllByRole('row')).toHaveLength(4)
  })
})
