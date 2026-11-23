import type { School, VisitType } from '../../api/types'
import { Button } from '../../components/Button'
import { SelectField } from '../../components/SelectField'
import { TextField } from '../../components/TextField'
import { hasActiveFilters, type VisitFilters as VisitFiltersValue } from './visitFilterParams'
import { isVisitType, visitTypeLabels, visitTypes } from './visitTypes'
import styles from './VisitFilters.module.scss'

interface VisitFiltersProps {
  schools: School[]
  value: VisitFiltersValue
  onSearchChange: (search: string) => void
  onSchoolChange: (schoolId: number | undefined) => void
  onVisitTypeChange: (visitType: VisitType | undefined) => void
  onDateFromChange: (date: string | undefined) => void
  onDateToChange: (date: string | undefined) => void
  onClear: () => void
}

export function VisitFilters({
  schools,
  value,
  onSearchChange,
  onSchoolChange,
  onVisitTypeChange,
  onDateFromChange,
  onDateToChange,
  onClear,
}: VisitFiltersProps) {
  return (
    <form
      className={styles.filters}
      role="search"
      aria-label="Filtrar visitas"
      onSubmit={(event) => event.preventDefault()}
    >
      <div className={styles.search}>
        <TextField
          label="Buscar"
          type="search"
          placeholder="Observaciones, docente o colegio"
          value={value.search ?? ''}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>
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
      <TextField
        label="Desde"
        type="date"
        value={value.dateFrom ?? ''}
        max={value.dateTo}
        onChange={(event) => onDateFromChange(event.target.value || undefined)}
      />
      <TextField
        label="Hasta"
        type="date"
        value={value.dateTo ?? ''}
        min={value.dateFrom}
        onChange={(event) => onDateToChange(event.target.value || undefined)}
      />
      {hasActiveFilters(value) && (
        <Button variant="ghost" onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </form>
  )
}
