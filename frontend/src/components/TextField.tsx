import type { InputHTMLAttributes } from 'react'

import { Field } from './Field'

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function TextField({ label, error, id, ...props }: TextFieldProps) {
  return (
    <Field label={label} error={error} id={id}>
      {(controlProps) => <input {...controlProps} {...props} />}
    </Field>
  )
}
