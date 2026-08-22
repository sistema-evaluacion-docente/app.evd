/**
 * Role ids exactly as the API spells them.
 *
 * They travel as free-form strings on `User.roles` and on `selectedRole`, so
 * every comparison used to repeat the literal — and a typo in one of them fails
 * open, showing a control to whoever should not have it.
 */
const ROLE = {
  ADMIN: 'ADMIN',
  TEACHER: 'DOCENTE',
  DEPARTMENT_DIRECTOR: 'DIRECTOR DE DEPARTAMENTO',
} as const

const ROLES_LABEL: Record<string, string> = {
  [ROLE.ADMIN]: 'Administrador',
  [ROLE.TEACHER]: 'Docente',
  [ROLE.DEPARTMENT_DIRECTOR]: 'Director de Departamento',
}

export { ROLE, ROLES_LABEL }
