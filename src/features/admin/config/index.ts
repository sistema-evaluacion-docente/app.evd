/**
 * Constant definitions for the admin feature:
 * table names, operation types, and their display labels.
 */

/** Audit log operation types with their human-readable labels and styling. */
export const OPERATIONS = [
  { value: 'CREATE', label: 'Crear', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { value: 'UPDATE', label: 'Actualizar', bg: 'bg-sky-50', text: 'text-sky-700' },
  { value: 'DELETE', label: 'Eliminar', bg: 'bg-brand-50', text: 'text-brand-700' },
  { value: 'READ', label: 'Leer', bg: 'bg-muted', text: 'text-muted-foreground' },
  { value: 'IMPORT', label: 'Importar', bg: 'bg-violet-50', text: 'text-violet-700' },
  { value: 'EXPORT', label: 'Exportar', bg: 'bg-amber-50', text: 'text-amber-700' },
  { value: 'UNASSIGN', label: 'Desasignar', bg: 'bg-brand-50', text: 'text-brand-700' },
  { value: 'ASSIGN', label: 'Asignar', bg: 'bg-sky-50', text: 'text-sky-700' },
]

/** Operation options for filters (label/value pairs only). */
export const OPERATION_OPTIONS = OPERATIONS.map(({ value, label }) => ({ value, label }))

/** Database table names mapped to their user-friendly labels for audit logs. */
export const TABLE_NAMES = [
  { value: 'departments', label: 'Departamentos' },
  { value: 'users', label: 'Usuarios' },
  { value: 'teachers', label: 'Docentes' },
  { value: 'academic_periods', label: 'Periodos' },
  { value: 'directors', label: 'Directores' },
  { value: 'evaluations', label: 'Evaluaciones' },
  { value: 'improvement_plans', label: 'Planes' },
  { value: 'improvement_plan_evidences', label: 'Evidencias de planes' },
  { value: 'subjects', label: 'Materias' },
  { value: 'academic_periods', label: 'Periodos académicos' },
  { value: 'faculties', label: 'Facultades' },
]

/**
 * Returns the human-readable label for a given table name.
 * Falls back to the raw value if no mapping is found.
 *
 * @example
 * getTableLabel('teachers') // => 'Docentes'
 * getTableLabel('unknown_table') // => 'unknown_table'
 */
export function getTableLabel(tableName: string | null | undefined): string {
  if (!tableName) return '—'
  const entry = TABLE_NAMES.find((t) => t.value === tableName)
  return entry?.label ?? tableName
}

/**
 * Get the operation config (label, bg, text) for a given operation value.
 *
 * @example
 * getOperation('CREATE') // => { value: 'CREATE', label: 'Crear', bg: 'bg-emerald-50', text: 'text-emerald-700' }
 */
export function getOperation(operation: string) {
  return OPERATIONS.find((o) => o.value === operation)
}

/**
 * Returns the human-readable label for a given operation type.
 * Falls back to the raw value if no mapping is found.
 *
 * @example
 * getOperationLabel('CREATE') // => 'Crear'
 * getOperationLabel('UNKNOWN') // => 'UNKNOWN'
 */
export function getOperationLabel(operation: string | null | undefined): string {
  if (!operation) return '—'
  const entry = OPERATIONS.find((op) => op.value === operation)
  return entry?.label ?? operation
}
