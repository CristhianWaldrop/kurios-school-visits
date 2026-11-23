import styles from './Loading.module.scss'

interface LoadingProps {
  label?: string
}

export function Loading({ label = 'Cargando…' }: LoadingProps) {
  return (
    <p role="status" className={styles.loading}>
      {label}
    </p>
  )
}
