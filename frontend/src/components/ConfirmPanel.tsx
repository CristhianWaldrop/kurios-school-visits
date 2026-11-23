import { useId, type ReactNode } from 'react'

import { Alert } from './Alert'
import { Button } from './Button'
import styles from './ConfirmPanel.module.scss'

interface ConfirmPanelProps {
  title: string
  description: string
  confirmLabel: string
  pendingLabel: string
  isPending: boolean
  error?: ReactNode
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmPanel({
  title,
  description,
  confirmLabel,
  pendingLabel,
  isPending,
  error,
  onConfirm,
  onCancel,
}: ConfirmPanelProps) {
  const titleId = useId()

  return (
    <section role="alertdialog" aria-labelledby={titleId} className={styles.panel}>
      <h2 id={titleId}>{title}</h2>
      <p>{description}</p>
      {error && <Alert>{error}</Alert>}
      <div className={styles.actions}>
        <Button variant="danger" onClick={onConfirm} disabled={isPending}>
          {isPending ? pendingLabel : confirmLabel}
        </Button>
        <Button variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancelar
        </Button>
      </div>
    </section>
  )
}
