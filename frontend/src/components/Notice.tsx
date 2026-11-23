import { useEffect, type ReactNode } from 'react'

import styles from './Notice.module.scss'

export const NOTICE_TIMEOUT_MS = 20_000

interface NoticeProps {
  children: ReactNode
  onDismiss: () => void
}

export function Notice({ children, onDismiss }: NoticeProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, NOTICE_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <div role="status" className={styles.notice}>
      <span>{children}</span>
      <button type="button" className={styles.close} aria-label="Cerrar aviso" onClick={onDismiss}>
        ×
      </button>
    </div>
  )
}
