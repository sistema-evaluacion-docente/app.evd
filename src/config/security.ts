/** One route of the app, with the roles allowed to open it. */
interface SecurityPage {
  /** Route path; `:param` segments match any value (e.g. `/evaluaciones/:id/pdf`). */
  path: string
  name: string
  roles: string[]
  /** Reachable by URL for the roles below, but never listed in the sidebar. */
  hidden?: boolean
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
      path: '/planes',
      name: 'Planes de mejoramiento',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
    },
    {
      path: '/evaluaciones/:id/pdf',
      name: 'Documento de la evaluación',
      roles: ['DIRECTOR DE DEPARTAMENTO', 'DOCENTE'],
      hidden: true,
    },
    {
      path: '/notificaciones',
      name: 'Notificaciones',
      roles: ['DIRECTOR DE DEPARTAMENTO', 'ADMIN', 'DOCENTE'],
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
      path: '/admin/logs',
      name: 'Logs',
      roles: ['ADMIN'],
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

/**
 * Whether a role may open a given path.
 *
 * @example
 * isAuthorizedForPage('/evaluaciones/12/pdf', 'DOCENTE') // true
 */
export function isAuthorizedForPage(path: string, role: string | null): boolean {
  return securityConfig.pages.some(
    (page) => matchesPath(path, page.path) && page.roles.includes(role ?? ''),
  )
}

/**
 * Returns the sidebar menus available for a given role. Hidden routes are left
 * out — they are reachable by URL but have no menu entry of their own.
 *
 * @param role The role to get the menus for.
 * @returns The menus available for the given role.
 */
export function getMenus(role: string): SecurityConfig['pages'] {
  return securityConfig.pages.filter((page) => !page.hidden && page.roles.includes(role))
}

export type SecurityConfig = typeof securityConfig

export default securityConfig
