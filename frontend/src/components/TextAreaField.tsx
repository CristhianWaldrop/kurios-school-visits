import type { TextareaHTMLAttributes } from 'react'

import { Field } from './Field'

interface TextAreaFieldProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
}

export function TextAreaField({ label, error, id, ...props }: TextAreaFieldProps) {
  return (
    <Field label={label} error={error} id={id}>
      {(controlProps) => <textarea {...controlProps} {...props} />}
    </Field>
  )
}
