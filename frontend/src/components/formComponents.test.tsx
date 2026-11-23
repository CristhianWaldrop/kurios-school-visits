import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SelectField } from './SelectField'
import { TextAreaField } from './TextAreaField'

describe('SelectField', () => {
  it('associates the label with the select and lists its options', () => {
    render(
      <SelectField label="Colegio" defaultValue="">
        <option value="">Selecciona un colegio</option>
        <option value="1">Colegio San Rafael</option>
      </SelectField>,
    )

    const select = screen.getByLabelText('Colegio')
    expect(select).toHaveDisplayValue('Selecciona un colegio')
    expect(screen.getByRole('option', { name: 'Colegio San Rafael' })).toBeInTheDocument()
  })

  it('reports the chosen option', async () => {
    const onChange = vi.fn()
    render(
      <SelectField label="Colegio" defaultValue="" onChange={onChange}>
        <option value="">Selecciona un colegio</option>
        <option value="1">Colegio San Rafael</option>
      </SelectField>,
    )

    await userEvent.selectOptions(screen.getByLabelText('Colegio'), '1')

    expect(onChange).toHaveBeenCalled()
  })

  it('exposes the error message and can be disabled', () => {
    render(
      <SelectField label="Docente" error="Selecciona un docente." disabled>
        <option value="">Selecciona</option>
      </SelectField>,
    )

    const select = screen.getByLabelText('Docente')
    expect(select).toBeInvalid()
    expect(select).toBeDisabled()
    expect(select).toHaveAccessibleDescription('Selecciona un docente.')
  })
})

describe('TextAreaField', () => {
  it('associates the label with the textarea', () => {
    render(<TextAreaField label="Observaciones" />)

    expect(screen.getByLabelText('Observaciones').tagName).toBe('TEXTAREA')
  })

  it('accepts typed text', async () => {
    const onChange = vi.fn()
    render(<TextAreaField label="Observaciones" onChange={onChange} />)

    await userEvent.type(screen.getByLabelText('Observaciones'), 'Hola')

    expect(onChange).toHaveBeenCalledTimes(4)
  })

  it('exposes the error message to assistive technology', () => {
    render(<TextAreaField label="Observaciones" error="Escribe las observaciones." />)

    const textarea = screen.getByLabelText('Observaciones')
    expect(textarea).toBeInvalid()
    expect(textarea).toHaveAccessibleDescription('Escribe las observaciones.')
  })
})
