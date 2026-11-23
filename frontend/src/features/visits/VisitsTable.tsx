import { Link } from 'react-router-dom'

import type { Visit } from '../../api/types'
import { formatVisitDate } from '../../lib/formatDate'
import { visitTypeLabels } from './visitTypes'
import styles from './VisitsTable.module.scss'

interface VisitsTableProps {
  visits: Visit[]
}

export function VisitsTable({ visits }: VisitsTableProps) {
  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope="col">Fecha</th>
            <th scope="col">Colegio</th>
            <th scope="col">Docente</th>
            <th scope="col">Tipo</th>
            <th scope="col">Especialista</th>
          </tr>
        </thead>
        <tbody>
          {visits.map((visit) => (
            <tr key={visit.id} className={styles.row}>
              <td>
                <Link to={`/visits/${visit.id}`} className={styles.link}>
                  {formatVisitDate(visit.visitDate)}
                </Link>
              </td>
              <td>{visit.school.name}</td>
              <td>{visit.teacher.fullName}</td>
              <td>{visitTypeLabels[visit.visitType]}</td>
              <td>{visit.specialist.fullName}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
