import type { VisitType } from '../../api/types'

export const visitTypeLabels: Record<VisitType, string> = {
  classroom_visit: 'Visita en aula',
  meeting: 'Encuentro',
}

export const visitTypes = Object.keys(visitTypeLabels) as VisitType[]

export function isVisitType(value: string | null): value is VisitType {
  return visitTypes.includes(value as VisitType)
}
