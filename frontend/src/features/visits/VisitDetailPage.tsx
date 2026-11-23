import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { describeError } from '../../api/errors'
import { ApiError } from '../../api/httpClient'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { ButtonLink } from '../../components/ButtonLink'
import { ConfirmPanel } from '../../components/ConfirmPanel'
import { Loading } from '../../components/Loading'
import { NotFoundPage } from '../../components/NotFoundPage'
import { Notice } from '../../components/Notice'
import { PageHeader } from '../../components/PageHeader'
import { formatVisitDate } from '../../lib/formatDate'
import { noticeState, useNotice } from '../../lib/useNotice'
import { useAuth } from '../auth/useAuth'
import { useDeleteVisit } from './useVisitMutations'
import { useVisit } from './useVisit'
import { useVisitId } from './useVisitId'
import { visitTypeLabels } from './visitTypes'
import styles from './VisitDetailPage.module.scss'

interface VisitDetailProps {
  id: number
}

function VisitDetail({ id }: VisitDetailProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { message: notice, dismiss: dismissNotice } = useNotice()
  const [isConfirming, setIsConfirming] = useState(false)

  const { data: visit, isPending, isError, error, refetch } = useVisit(id)
  const deleteMutation = useDeleteVisit()

  if (isPending) {
    return <Loading label="Cargando visita…" />
  }

  if (isError) {
    if (error instanceof ApiError && error.status === 404) {
      return <NotFoundPage />
    }
    return (
      <>
        <Alert>{describeError(error)}</Alert>
        <Button variant="secondary" onClick={() => void refetch()}>
          Reintentar
        </Button>
      </>
    )
  }

  const canModify = user?.id === visit.specialist.id

  async function handleDelete() {
    try {
      await deleteMutation.mutateAsync(id)
      navigate('/visits', { replace: true, state: noticeState('Visita eliminada.') })
    } catch {
      // The error is shown from deleteMutation.error inside the confirmation panel.
    }
  }

  return (
    <>
      <PageHeader
        title="Detalle de la visita"
        description={`Registrada por ${visit.specialist.fullName}`}
        actions={
          canModify &&
          !isConfirming && (
            <>
              <ButtonLink to={`/visits/${id}/edit`} variant="secondary">
                Editar
              </ButtonLink>
              <Button variant="secondary" onClick={() => setIsConfirming(true)}>
                Eliminar
              </Button>
            </>
          )
        }
      />

      {notice && !isConfirming && <Notice onDismiss={dismissNotice}>{notice}</Notice>}

      {isConfirming && (
        <ConfirmPanel
          title="¿Eliminar esta visita?"
          description="Dejará de mostrarse en la aplicación."
          confirmLabel="Eliminar visita"
          pendingLabel="Eliminando…"
          isPending={deleteMutation.isPending}
          error={deleteMutation.isError ? describeError(deleteMutation.error) : undefined}
          onConfirm={() => void handleDelete()}
          onCancel={() => {
            deleteMutation.reset()
            setIsConfirming(false)
          }}
        />
      )}

      {!canModify && (
        <p className={styles.hint}>Solo quien registró la visita puede editarla o eliminarla.</p>
      )}

      <dl className={styles.details}>
        <dt>Fecha</dt>
        <dd>{formatVisitDate(visit.visitDate)}</dd>
        <dt>Tipo de visita</dt>
        <dd>{visitTypeLabels[visit.visitType]}</dd>
        <dt>Colegio</dt>
        <dd>
          {visit.school.name} ({visit.school.city})
        </dd>
        <dt>Docente</dt>
        <dd>{visit.teacher.fullName}</dd>
        <dt>Especialista</dt>
        <dd>{visit.specialist.fullName}</dd>
        <dt>Observaciones</dt>
        <dd className={styles.observations}>{visit.observations}</dd>
      </dl>

      <Link to="/visits">Volver al listado</Link>
    </>
  )
}

export function VisitDetailPage() {
  const id = useVisitId()
  return id === null ? <NotFoundPage /> : <VisitDetail id={id} />
}
