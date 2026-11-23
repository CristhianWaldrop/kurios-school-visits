import type { SelectHTMLAttributes } from 'react'

import { Field } from './Field'

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
}

export function SelectField({ label, error, id, children, ...props }: SelectFieldProps) {
  return (
    <Field label={label} error={error} id={id}>
      {(controlProps) => (
        <select {...controlProps} {...props}>
          {children}
        </select>
      )}
    </Field>
  )
}
