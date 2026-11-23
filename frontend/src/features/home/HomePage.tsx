import { Link } from 'react-router-dom'

import { describeError } from '../../api/errors'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { ButtonLink } from '../../components/ButtonLink'
import { Loading } from '../../components/Loading'
import { useAuth } from '../auth/useAuth'
import { useLatestVisits } from '../visits/useLatestVisits'
import { VisitsTable } from '../visits/VisitsTable'
import styles from './HomePage.module.scss'

export function HomePage() {
  const { user } = useAuth()
  const { data: visits, isPending, isError, error, refetch } = useLatestVisits()

  return (
    <>
      <div className={styles.header}>
        <div>
          <h1>Hola, {user?.firstName || user?.username}</h1>
          <p>Registra tus visitas a colegios y consulta las más recientes.</p>
        </div>
        <div className={styles.actions}>
          <ButtonLink to="/visits/new">Registrar visita</ButtonLink>
          <ButtonLink to="/visits" variant="secondary">
            Ver visitas
          </ButtonLink>
        </div>
      </div>

      <section className={styles.section} aria-labelledby="latest-visits-title">
        <div className={styles.sectionHeader}>
          <h2 id="latest-visits-title">Últimas visitas</h2>
          <Link to="/visits">Ver todas</Link>
        </div>

        {isPending && <Loading label="Cargando visitas…" />}

        {isError && (
          <>
            <Alert>{describeError(error)}</Alert>
            <div>
              <Button variant="secondary" onClick={() => void refetch()}>
                Reintentar
              </Button>
            </div>
          </>
        )}

        {visits && visits.length === 0 && (
          <p className={styles.empty}>Todavía no hay visitas registradas.</p>
        )}

        {visits && visits.length > 0 && <VisitsTable visits={visits} />}
      </section>
    </>
  )
}
