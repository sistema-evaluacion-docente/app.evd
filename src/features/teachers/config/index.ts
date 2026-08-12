import type { SortField } from '@/components/common/DataTableFilters'

/**
 * Contract type options shared by the teacher filters and forms. Left
 * without an explicit array type so its literal `value: string` shape stays
 * assignable both to `DataTableFilters`' `FilterOption[]` and to
 * `DynamicFormDrawer`'s narrower `SelectOption[]`.
 */
export const CONTRACT_TYPES = [
  { label: 'Cátedra', value: 'Cátedra' },
  { label: 'Planta', value: 'Planta' },
]

/** Sortable fields for the teachers-with-averages list. */
export const TEACHER_SORT_FIELDS: SortField[] = [
  { value: 'name', label: 'Nombre' },
  { value: 'overall_average', label: 'Promedio' },
  { value: 'high_risk_comments_count', label: 'Comentarios de alto riesgo' },
  { value: 'created_at', label: 'Fecha de creación' },
]
