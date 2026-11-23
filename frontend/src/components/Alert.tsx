import type { ReactNode } from 'react'

import styles from './Alert.module.scss'

interface AlertProps {
  children: ReactNode
}

export function Alert({ children }: AlertProps) {
  return (
    <div role="alert" className={styles.alert}>
      {children}
    </div>
  )
}
