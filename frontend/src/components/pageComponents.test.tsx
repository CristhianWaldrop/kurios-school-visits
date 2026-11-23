import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { ConfirmPanel } from './ConfirmPanel'
import { NotFoundPage } from './NotFoundPage'
import { Notice, NOTICE_TIMEOUT_MS } from './Notice'
import { PageHeader } from './PageHeader'
import { Pagination } from './Pagination'

describe('PageHeader', () => {
  it('renders the title, the description and the actions', () => {
    render(
      <PageHeader
        title="Visitas"
        description="Gestiona las visitas."
        actions={<button>Nueva</button>}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Visitas' })).toBeInTheDocument()
    expect(screen.getByText('Gestiona las visitas.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nueva' })).toBeInTheDocument()
  })

  it('works with only a title', () => {
    render(<PageHeader title="Visitas" />)

    expect(screen.getByRole('heading', { name: 'Visitas' })).toBeInTheDocument()
  })
})

describe('Notice', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces its content as a status', () => {
    render(<Notice onDismiss={vi.fn()}>Visita registrada.</Notice>)

    expect(screen.getByRole('status')).toHaveTextContent('Visita registrada.')
  })

  it('can be closed with its button', async () => {
    const onDismiss = vi.fn()
    render(<Notice onDismiss={onDismiss}>Visita registrada.</Notice>)

    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }))

    expect(onDismiss).toHaveBeenCalledOnce()
  })

  it('closes itself after 20 seconds', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    render(<Notice onDismiss={onDismiss}>Visita registrada.</Notice>)

    vi.advanceTimersByTime(NOTICE_TIMEOUT_MS - 1)
    expect(onDismiss).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(onDismiss).toHaveBeenCalledOnce()
    expect(NOTICE_TIMEOUT_MS).toBe(20_000)
  })

  it('does not close itself after it has been removed', () => {
    vi.useFakeTimers()
    const onDismiss = vi.fn()
    const { unmount } = render(<Notice onDismiss={onDismiss}>Visita registrada.</Notice>)

    unmount()
    vi.advanceTimersByTime(NOTICE_TIMEOUT_MS * 2)

    expect(onDismiss).not.toHaveBeenCalled()
  })
})

describe('NotFoundPage', () => {
  it('explains the problem and links back to the home page', () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Página no encontrada' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/')
  })
})

describe('Pagination', () => {
  it('shows the total and the current page', () => {
    render(<Pagination page={2} pageCount={5} totalLabel="45 visitas" onChange={vi.fn()} />)

    expect(screen.getByText('45 visitas')).toBeInTheDocument()
    expect(screen.getByText('Página 2 de 5')).toBeInTheDocument()
  })

  it('goes to the previous and next pages', async () => {
    const onChange = vi.fn()
    render(<Pagination page={2} pageCount={3} totalLabel="25 visitas" onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }))
    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))

    expect(onChange).toHaveBeenNthCalledWith(1, 1)
    expect(onChange).toHaveBeenNthCalledWith(2, 3)
  })

  it('disables Anterior on the first page', () => {
    render(<Pagination page={1} pageCount={3} totalLabel="25 visitas" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeEnabled()
  })

  it('disables Siguiente on the last page', () => {
    render(<Pagination page={3} pageCount={3} totalLabel="25 visitas" onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Siguiente' })).toBeDisabled()
  })

  it('is a labelled navigation landmark', () => {
    render(<Pagination page={1} pageCount={1} totalLabel="1 visita" onChange={vi.fn()} />)

    expect(screen.getByRole('navigation', { name: 'Paginación' })).toBeInTheDocument()
  })
})

describe('ConfirmPanel', () => {
  function renderPanel(overrides: Partial<Parameters<typeof ConfirmPanel>[0]> = {}) {
    const props = {
      title: '¿Eliminar esta visita?',
      description: 'Dejará de mostrarse en la aplicación.',
      confirmLabel: 'Eliminar visita',
      pendingLabel: 'Eliminando…',
      isPending: false,
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
      ...overrides,
    }
    render(<ConfirmPanel {...props} />)
    return props
  }

  it('is a dialog labelled by its title', () => {
    renderPanel()

    expect(screen.getByRole('alertdialog', { name: '¿Eliminar esta visita?' })).toBeInTheDocument()
    expect(screen.getByText('Dejará de mostrarse en la aplicación.')).toBeInTheDocument()
  })

  it('confirms and cancels', async () => {
    const { onConfirm, onCancel } = renderPanel()

    await userEvent.click(screen.getByRole('button', { name: 'Eliminar visita' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onConfirm).toHaveBeenCalledOnce()
    expect(onCancel).toHaveBeenCalledOnce()
  })

  it('blocks both buttons while the action is in progress', () => {
    renderPanel({ isPending: true })

    expect(screen.getByRole('button', { name: 'Eliminando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
  })

  it('shows an error when there is one', () => {
    renderPanel({ error: 'No tienes permiso para realizar esta acción.' })

    expect(screen.getByRole('alert')).toHaveTextContent('No tienes permiso')
  })
})
