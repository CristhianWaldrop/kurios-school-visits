import type { School, VisitType } from '../../api/types'
import { Button } from '../../components/Button'
import { SelectField } from '../../components/SelectField'
import { hasActiveFilters, type VisitFilters as VisitFiltersValue } from './visitFilterParams'
import { isVisitType, visitTypeLabels, visitTypes } from './visitTypes'
import styles from './VisitFilters.module.scss'

interface VisitFiltersProps {
  schools: School[]
  value: VisitFiltersValue
  onSchoolChange: (schoolId: number | undefined) => void
  onVisitTypeChange: (visitType: VisitType | undefined) => void
  onClear: () => void
}

export function VisitFilters({
  schools,
  value,
  onSchoolChange,
  onVisitTypeChange,
  onClear,
}: VisitFiltersProps) {
  return (
    <form className={styles.filters} role="search" aria-label="Filtrar visitas">
      <SelectField
        label="Colegio"
        value={value.schoolId ?? ''}
        onChange={(event) =>
          onSchoolChange(event.target.value ? Number(event.target.value) : undefined)
        }
      >
        <option value="">Todos los colegios</option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name}
          </option>
        ))}
      </SelectField>
      <SelectField
        label="Tipo de visita"
        value={value.visitType ?? ''}
        onChange={(event) =>
          onVisitTypeChange(isVisitType(event.target.value) ? event.target.value : undefined)
        }
      >
        <option value="">Todos los tipos</option>
        {visitTypes.map((type) => (
          <option key={type} value={type}>
            {visitTypeLabels[type]}
          </option>
        ))}
      </SelectField>
      {hasActiveFilters(value) && (
        <Button variant="ghost" onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </form>
  )
}
