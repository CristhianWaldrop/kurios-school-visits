import { useId, type ReactNode } from 'react'

import styles from './Field.module.scss'

export interface FieldControlProps {
  id: string
  className: string
  'aria-invalid'?: true
  'aria-describedby'?: string
}

interface FieldProps {
  label: string
  error?: string
  id?: string
  children: (controlProps: FieldControlProps) => ReactNode
}

export function Field({ label, error, id, children }: FieldProps) {
  const generatedId = useId()
  const controlId = id ?? generatedId
  const errorId = `${controlId}-error`

  return (
    <div className={styles.field}>
      <label htmlFor={controlId} className={styles.label}>
        {label}
      </label>
      {children({
        id: controlId,
        className: styles.control ?? '',
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
      })}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
