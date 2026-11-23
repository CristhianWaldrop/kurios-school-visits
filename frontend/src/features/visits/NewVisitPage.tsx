import { useNavigate } from 'react-router-dom'

import type { VisitInput } from '../../api/types'
import { PageHeader } from '../../components/PageHeader'
import { noticeState } from '../../lib/useNotice'
import { emptyVisitFormValues } from './visitFormModel'
import { VisitForm } from './VisitForm'
import { useCreateVisit } from './useVisitMutations'

export function NewVisitPage() {
  const navigate = useNavigate()
  const createMutation = useCreateVisit()

  async function handleSubmit(input: VisitInput) {
    const visit = await createMutation.mutateAsync(input)
    navigate(`/visits/${visit.id}`, { replace: true, state: noticeState('Visita registrada.') })
  }

  return (
    <>
      <PageHeader
        title="Registrar visita"
        description="Completa los datos de la visita que realizaste."
      />
      <VisitForm
        initialValues={emptyVisitFormValues}
        submitLabel="Registrar visita"
        cancelTo="/visits"
        onSubmit={handleSubmit}
      />
    </>
  )
}
