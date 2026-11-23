import { Link, useNavigate } from 'react-router-dom'

import { describeError } from '../../api/errors'
import { ApiError } from '../../api/httpClient'
import type { VisitInput } from '../../api/types'
import { Alert } from '../../components/Alert'
import { Button } from '../../components/Button'
import { Loading } from '../../components/Loading'
import { NotFoundPage } from '../../components/NotFoundPage'
import { PageHeader } from '../../components/PageHeader'
import { noticeState } from '../../lib/useNotice'
import { useAuth } from '../auth/useAuth'
import { visitToFormValues } from './visitFormModel'
import { canManageVisit } from './visitPermissions'
import { VisitForm } from './VisitForm'
import { useUpdateVisit } from './useVisitMutations'
import { useVisit } from './useVisit'
import { useVisitId } from './useVisitId'

interface EditVisitProps {
  id: number
}

function EditVisit({ id }: EditVisitProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: visit, isPending, isError, error, refetch } = useVisit(id)
  const updateMutation = useUpdateVisit(id)

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

  if (!canManageVisit(user, visit)) {
    return (
      <>
        <h1>Editar visita</h1>
        <Alert>Solo quien registró la visita puede modificarla.</Alert>
        <p>
          <Link to={`/visits/${id}`}>Volver al detalle</Link>
        </p>
      </>
    )
  }

  async function handleSubmit(input: VisitInput) {
    await updateMutation.mutateAsync(input)
    navigate(`/visits/${id}`, { replace: true, state: noticeState('Cambios guardados.') })
  }

  return (
    <>
      <PageHeader title="Editar visita" description="Actualiza los datos de la visita." />
      <VisitForm
        initialValues={visitToFormValues(visit)}
        submitLabel="Guardar cambios"
        cancelTo={`/visits/${id}`}
        onSubmit={handleSubmit}
      />
    </>
  )
}

export function EditVisitPage() {
  const id = useVisitId()
  return id === null ? <NotFoundPage /> : <EditVisit id={id} />
}
