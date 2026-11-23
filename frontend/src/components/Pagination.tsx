import { Button } from './Button'
import styles from './Pagination.module.scss'

interface PaginationProps {
  page: number
  pageCount: number
  totalLabel: string
  onChange: (page: number) => void
}

export function Pagination({ page, pageCount, totalLabel, onChange }: PaginationProps) {
  return (
    <nav className={styles.pagination} aria-label="Paginación">
      <span>{totalLabel}</span>
      <div className={styles.controls}>
        <Button variant="secondary" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          Anterior
        </Button>
        <span>
          Página {page} de {pageCount}
        </span>
        <Button variant="secondary" disabled={page >= pageCount} onClick={() => onChange(page + 1)}>
          Siguiente
        </Button>
      </div>
    </nav>
  )
}
