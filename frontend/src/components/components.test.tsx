import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

import { Alert } from './Alert'
import { Button } from './Button'
import { ButtonLink } from './ButtonLink'
import { Loading } from './Loading'
import { TextField } from './TextField'

describe('Button', () => {
  it('does not submit forms unless asked to', () => {
    render(<Button>Guardar</Button>)

    expect(screen.getByRole('button', { name: 'Guardar' })).toHaveAttribute('type', 'button')
  })

  it('calls onClick when pressed', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Guardar</Button>)

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not react when disabled', async () => {
    const onClick = vi.fn()
    render(
      <Button onClick={onClick} disabled>
        Guardar
      </Button>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onClick).not.toHaveBeenCalled()
  })
})

describe('ButtonLink', () => {
  it('renders a link to the given route', () => {
    render(
      <MemoryRouter>
        <ButtonLink to="/visits/new">Registrar visita</ButtonLink>
      </MemoryRouter>,
    )

    expect(screen.getByRole('link', { name: 'Registrar visita' })).toHaveAttribute(
      'href',
      '/visits/new',
    )
  })
})

describe('TextField', () => {
  it('associates the label with the input', () => {
    render(<TextField label="Usuario" />)

    expect(screen.getByLabelText('Usuario')).toBeInTheDocument()
  })

  it('is valid and has no description without an error', () => {
    render(<TextField label="Usuario" />)

    const input = screen.getByLabelText('Usuario')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
  })

  it('exposes the error message to assistive technology', () => {
    render(<TextField label="Usuario" error="Ingresa tu usuario." />)

    const input = screen.getByLabelText('Usuario')
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Ingresa tu usuario.')
  })

  it('passes native input props through', async () => {
    const onChange = vi.fn()
    render(<TextField label="Usuario" onChange={onChange} />)

    await userEvent.type(screen.getByLabelText('Usuario'), 'a')

    expect(onChange).toHaveBeenCalled()
  })
})

describe('Alert', () => {
  it('announces its content as an alert', () => {
    render(<Alert>Algo salió mal</Alert>)

    expect(screen.getByRole('alert')).toHaveTextContent('Algo salió mal')
  })
})

describe('Loading', () => {
  it('shows a default label as a status', () => {
    render(<Loading />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando…')
  })

  it('accepts a custom label', () => {
    render(<Loading label="Cargando visitas…" />)

    expect(screen.getByRole('status')).toHaveTextContent('Cargando visitas…')
  })
})
