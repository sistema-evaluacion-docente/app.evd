/** One route of the app, with the roles allowed to open it. */
export interface SecurityPage {
  /** Route path; `:param` segments match any value (e.g. `/evaluaciones/:id/pdf`). */
  path: string
  name: string
  roles: string[]
  hidden?: boolean
  requiresDepartment?: boolean
}

export interface AccessContext {
  hasDepartment?: boolean
}

const securityConfig: { pages: SecurityPage[] } = {
  pages: [
    {
      path: '/home',
      name: 'Resumen',
      roles: ['DIRECTOR DE DEPARTAMENTO', 'ADMIN', 'DOCENTE'],
    },

    {
      path: '/periodos',
      name: 'Periodos',
      roles: ['DOCENTE'],
    },
    {
      path: '/periodos/materias',
      name: 'Materias',
      roles: ['DOCENTE'],
    },
    {
      path: '/mis-planes',
      name: 'Planes de mejoramiento',
      roles: ['DOCENTE'],
    },
    {
      path: '/evaluaciones',
      name: 'Evaluaciones',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
    },
    {
      path: '/docentes',
      name: 'Docentes',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
    },
    {
      path: '/materias',
      name: 'Materias',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
    },
    {
      path: '/comentarios',
      name: 'Comentarios',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
    },
    {
      path: '/alertas',
      name: 'Alertas',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
    },
    {
      path: '/planes',
      name: 'Planes de mejoramiento',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
      requiresDepartment: true,
    },
    {
      path: '/acciones',
      name: 'Acciones sugeridas',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
    },
    {
      path: '/evaluaciones/:id/pdf',
      name: 'Documento de la evaluación',
      roles: ['DIRECTOR DE DEPARTAMENTO', 'DOCENTE'],
      hidden: true,
    },
    {
      path: '/admin/facultades',
      name: 'Facultades',
      roles: ['ADMIN'],
    },
    {
      path: '/admin/departamentos',
      name: 'Departamentos',
      roles: ['ADMIN'],
    },
    {
      path: '/programas',
      name: 'Programas',
      roles: ['ADMIN'],
    },
    {
      path: '/admin/periodos',
      name: 'Periodos',
      roles: ['ADMIN'],
    },
    {
      path: '/admin/usuarios',
      name: 'Usuarios',
      roles: ['ADMIN'],
    },
    {
      path: '/admin/directores',
      name: 'Directores',
      roles: ['ADMIN'],
    },
    {
      path: '/admin/historial',
      name: 'Historial',
      roles: ['ADMIN'],
    },
    {
      path: '/notificaciones',
      name: 'Notificaciones',
      roles: ['DIRECTOR DE DEPARTAMENTO', 'ADMIN', 'DOCENTE'],
    },
    {
      path: '/admin/configuracion',
      name: 'Configuración',
      roles: ['ADMIN'],
    },
  ],
}

/**
 * Whether a concrete path matches a configured route. Plain paths also cover
 * everything nested under them (`/periodos` covers `/periodos/2025-1`), while a
 * path with `:param` segments matches that exact shape only — `/evaluaciones/:id/pdf`
 * grants the PDF page without granting the rest of `/evaluaciones`.
 */
function matchesPath(path: string, routePath: string): boolean {
  if (!routePath.includes(':')) {
    return path === routePath || path.startsWith(`${routePath}/`)
  }

  const segments = path.split('/')
  const routeSegments = routePath.split('/')

  if (segments.length !== routeSegments.length) return false

  return routeSegments.every(
    (segment, index) => segment.startsWith(':') || segment === segments[index],
  )
}

/** Whether the context satisfies the extra conditions a page asks for. */
function meetsRequirements(page: SecurityPage, context?: AccessContext): boolean {
  // No context given means the caller makes no claim either way, so a page
  // gated on the department is left alone rather than blocked on a guess.
  if (!page.requiresDepartment || context?.hasDepartment === undefined) return true

  return context.hasDepartment
}

/**
 * Every configured route the path falls under, whatever the role.
 *
 * Exposed so a caller can tell "this role may not open it" apart from "this
 * user is missing something the page needs" — two blocks that read very
 * differently to whoever hits them.
 */
export function pagesForPath(path: string): SecurityPage[] {
  return securityConfig.pages.filter((page) => matchesPath(path, page.path))
}

/**
 * Whether a role may open a given path.
 *
 * @example
 * isAuthorizedForPage('/evaluaciones/12/pdf', 'DOCENTE') // true
 *
 * @example
 * // A director with no department gets no improvement plans.
 * isAuthorizedForPage('/planes', 'DIRECTOR DE DEPARTAMENTO', { hasDepartment: false }) // false
 */
export function isAuthorizedForPage(
  path: string,
  role: string | null,
  context?: AccessContext,
): boolean {
  return securityConfig.pages.some(
    (page) =>
      matchesPath(path, page.path) &&
      page.roles.includes(role ?? '') &&
      meetsRequirements(page, context),
  )
}

/**
 * Returns the sidebar menus available for a given role. Hidden routes are left
 * out — they are reachable by URL but have no menu entry of their own — and so
 * are the ones the context does not qualify for.
 *
 * @param role The role to get the menus for.
 * @param context What the user has beyond the role, e.g. a department.
 * @returns The menus available for the given role.
 */
export function getMenus(role: string, context?: AccessContext): SecurityConfig['pages'] {
  return securityConfig.pages.filter(
    (page) => !page.hidden && page.roles.includes(role) && meetsRequirements(page, context),
  )
}

export type SecurityConfig = typeof securityConfig

export default securityConfig
