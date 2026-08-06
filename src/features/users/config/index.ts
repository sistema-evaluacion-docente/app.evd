/**
 * User role constants and their display labels, shared by the users table
 * columns and the edit form.
 */
export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  DOCENTE: 'Docente',
  'DIRECTOR DE DEPARTAMENTO': 'Director de departamento',
}

/** Role options for the edit form (label/value pairs). */
export const ROLE_OPTIONS = Object.entries(ROLE_LABELS).map(([value, label]) => ({ value, label }))

/**
 * Returns the human-readable label for a given role.
 * Falls back to the raw value if no mapping is found.
 *
 * @example
 * getRoleLabel('DOCENTE') // => 'Docente'
 * getRoleLabel('UNKNOWN') // => 'UNKNOWN'
 */
export function getRoleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}
