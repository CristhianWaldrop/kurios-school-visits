import { useSearchParams } from 'react-router-dom'

import { describeError } from '../../api/errors'
import type { VisitType } from '../../api/types'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { ButtonLink } from '../../components/ButtonLink'
import { Loading } from '../../components/Loading'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { useNotice } from '../../lib/useNotice'
import { useSchools } from '../directory/useSchools'
import {
  hasActiveFilters,
  parseVisitFilters,
  serializeVisitFilters,
  type VisitFilters as VisitFiltersValue,
} from './visitFilterParams'
import { VisitFilters } from './VisitFilters'
import { useVisits } from './useVisits'
import { VisitsTable } from './VisitsTable'
import styles from './VisitsListPage.module.scss'

const PAGE_SIZE = 10

function describeTotal(count: number): string {
  return count === 1 ? '1 visita' : `${count} visitas`
}

export function VisitsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const filters = parseVisitFilters(searchParams)
  const { message: notice, dismiss: dismissNotice } = useNotice()

  const schools = useSchools()
  const { data, isPending, isError, error, isPlaceholderData, refetch } = useVisits({
    page: filters.page,
    pageSize: PAGE_SIZE,
    schoolId: filters.schoolId,
    visitType: filters.visitType,
  })

  function updateFilters(next: VisitFiltersValue) {
    setSearchParams(serializeVisitFilters(next))
  }

  function changeSchool(schoolId: number | undefined) {
    updateFilters({ ...filters, schoolId, page: 1 })
  }

  function changeVisitType(visitType: VisitType | undefined) {
    updateFilters({ ...filters, visitType, page: 1 })
  }

  function clearFilters() {
    updateFilters({ page: 1 })
  }

  const filtered = hasActiveFilters(filters)
  const pageCount = data ? Math.max(1, Math.ceil(data.count / PAGE_SIZE)) : 1

  return (
    <>
      <PageHeader
        title="Visitas"
        description="Consulta, filtra y gestiona las visitas registradas."
        actions={<ButtonLink to="/visits/new">Registrar visita</ButtonLink>}
      />

      {notice && <Notice onDismiss={dismissNotice}>{notice}</Notice>}

      <VisitFilters
        schools={schools.data ?? []}
        value={filters}
        onSchoolChange={changeSchool}
        onVisitTypeChange={changeVisitType}
        onClear={clearFilters}
      />

      <div className={styles.content}>
        {isPending && <Loading label="Cargando visitas…" />}

        {isError && (
          <>
            <Alert>{describeError(error)}</Alert>
            <div>
              {filters.page > 1 ? (
                <Button variant="secondary" onClick={() => updateFilters({ ...filters, page: 1 })}>
                  Ir a la primera página
                </Button>
              ) : (
                <Button variant="secondary" onClick={() => void refetch()}>
                  Reintentar
                </Button>
              )}
            </div>
          </>
        )}

        {data && data.count === 0 && (
          <div className={styles.empty}>
            <p>
              {filtered
                ? 'No hay visitas que coincidan con los filtros.'
                : 'Todavía no hay visitas registradas.'}
            </p>
            {filtered ? (
              <Button variant="secondary" onClick={clearFilters}>
                Limpiar filtros
              </Button>
            ) : (
              <ButtonLink to="/visits/new">Registrar la primera visita</ButtonLink>
            )}
          </div>
        )}

        {data && data.count > 0 && (
          <>
            <div className={isPlaceholderData ? styles.dimmed : undefined}>
              <VisitsTable visits={data.results} />
            </div>
            <Pagination
              page={filters.page}
              pageCount={pageCount}
              totalLabel={describeTotal(data.count)}
              onChange={(page) => updateFilters({ ...filters, page })}
            />
          </>
        )}
      </div>
    </>
  )
}
