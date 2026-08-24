/**
 * Constant definitions for the admin feature:
 * table names, operation types, and their display labels.
 */

import { STATUS_TONE_CLASS, type StatusTone } from '@/lib/statusTone'

/**
 * Audit log operation types with their human-readable labels and tone.
 *
 * The tone is a key of `STATUS_TONE_CLASS`, not a pair of raw Tailwind classes:
 * the eleven entries used to carry their own `bg-*-50` / `text-*-700` literals
 * with no `dark:` variant at all, so in dark mode every badge but `READ` came
 * out dark text on a near-white pill.
 *
 * Read semantically rather than one hue per operation — the label already says
 * which one it is: verde lo que nace o se habilita, rojo lo que se destruye,
 * ámbar lo que se desvincula, azul lo que se modifica, marca lo que entra o
 * sale del sistema, y gris lo que no cambia nada.
 */
export const OPERATIONS: { value: string; label: string; tone: StatusTone }[] = [
  { value: 'CREATE', label: 'Crear', tone: 'success' },
  { value: 'UPDATE', label: 'Actualizar', tone: 'accent' },
  { value: 'DELETE', label: 'Eliminar', tone: 'danger' },
  { value: 'READ', label: 'Leer', tone: 'neutral' },
  { value: 'IMPORT', label: 'Importar', tone: 'info' },
  { value: 'EXPORT', label: 'Exportar', tone: 'info' },
  { value: 'UNASSIGN', label: 'Desasignar', tone: 'warning' },
  { value: 'ASSIGN', label: 'Asignar', tone: 'accent' },
  { value: 'ACTIVATE', label: 'Activar', tone: 'success' },
  { value: 'DEACTIVATE', label: 'Desactivar', tone: 'neutral' },
  { value: 'BULK_CREATE', label: 'Crear en masa', tone: 'success' },
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
 * Get the operation config (label, tone) for a given operation value.
 *
 * @example
 * getOperation('CREATE') // => { value: 'CREATE', label: 'Crear', tone: 'success' }
 */
export function getOperation(operation: string) {
  return OPERATIONS.find((o) => o.value === operation)
}

/**
 * Badge classes of an operation, already resolved — so the tables and the
 * detail drawer stop composing `bg`/`text` by hand and can never disagree.
 * An unknown operation falls back to the neutral pill.
 *
 * @example
 * <Badge className={getOperationToneClass(log.operation)}>…</Badge>
 */
export function getOperationToneClass(operation: string | null | undefined): string {
  const tone = (operation ? getOperation(operation)?.tone : undefined) ?? 'neutral'

  return STATUS_TONE_CLASS[tone]
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

/** Setting value types with their human-readable labels and badge tone. */
export const SETTING_VALUE_TYPES: { value: string; label: string; tone: StatusTone }[] = [
  { value: 'string', label: 'Texto', tone: 'accent' },
  { value: 'int', label: 'Entero', tone: 'info' },
  { value: 'float', label: 'Decimal', tone: 'info' },
  { value: 'boolean', label: 'Booleano', tone: 'success' },
  { value: 'json', label: 'JSON', tone: 'warning' },
  { value: 'date', label: 'Fecha', tone: 'neutral' },
]

/**
 * Get the badge config (label, tone) for a given setting value type.
 *
 * @example
 * getValueTypeConfig('boolean') // => { value: 'boolean', label: 'Booleano', tone: 'success' }
 */
export function getValueTypeConfig(valueType: string) {
  return SETTING_VALUE_TYPES.find((v) => v.value === valueType)
}

/**
 * Badge classes of a setting value type, already resolved.
 *
 * @example
 * <Badge className={getValueTypeToneClass('json')}>JSON</Badge>
 */
export function getValueTypeToneClass(valueType: string | null | undefined): string {
  const tone = (valueType ? getValueTypeConfig(valueType)?.tone : undefined) ?? 'neutral'

  return STATUS_TONE_CLASS[tone]
}

/**
 * Returns the human-readable label for a given setting value type.
 * Falls back to the raw value if no mapping is found.
 *
 * @example
 * getValueTypeLabel('boolean') // => 'Booleano'
 * getValueTypeLabel('UNKNOWN') // => 'UNKNOWN'
 */
export function getValueTypeLabel(valueType: string | null | undefined): string {
  if (!valueType) return '—'
  const entry = SETTING_VALUE_TYPES.find((v) => v.value === valueType)
  return entry?.label ?? valueType
}
