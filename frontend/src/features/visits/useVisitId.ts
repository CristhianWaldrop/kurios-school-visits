import { useParams } from 'react-router-dom'

export function useVisitId(): number | null {
  const { visitId } = useParams()
  const id = Number(visitId)
  return Number.isInteger(id) && id > 0 ? id : null
}
