const securityConfig = {
  pages: [
    {
      path: '/',
      name: 'Mi Resumen',
      roles: ['DIRECTOR DE DEPARTAMENTO', 'ADMIN', 'DOCENTE'],
    },
    // {
    //   path: "/summary",
    //   name: "Mi Resumen",
    //   roles: ["DOCENTE"],
    // },
    {
      path: '/periodos',
      name: 'Mis periodos',
      roles: ['DOCENTE'],
    },
    // {
    //   path: "/summary",
    //   name: "Mi Resumen",
    //   roles: ["DOCENTE"],
    // },
    // {
    //   path: "/my-plans",
    //   name: "Mi Plan de Mejora",
    //   roles: ["DOCENTE"],
    // },
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
      path: '/comentarios',
      name: 'Comentarios',
      roles: ['DIRECTOR DE DEPARTAMENTO'],
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
      name: 'Períodos',
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
 * Returns the menus available for a given role.
 *
 * @param role The role to get the menus for.
 * @returns The menus available for the given role.
 */
export function getMenus(role: string): SecurityConfig['pages'] {
  return securityConfig.pages.filter((page) => page.roles.includes(role))
}

export type SecurityConfig = typeof securityConfig

export default securityConfig
