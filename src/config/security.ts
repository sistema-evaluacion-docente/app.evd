const securityConfig = {
  pages: [
    {
      path: "/dashboard",
      name: "Dashboard",
      roles: ["DOCENTE", "DIRECTOR DE DEPARTAMENTO", "ADMIN"],
    },
    {
      path: "/summary",
      name: "Mi Resumen",
      roles: ["DOCENTE"],
    },
    {
      path: "/periods",
      name: "Mis periodos",
      roles: ["DOCENTE"],
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
      path: "/evaluations",
      name: "Evaluaciones",
      roles: ["DIRECTOR DE DEPARTAMENTO"],
    },
    // {
    //   path: "/teachers",
    //   name: "Docentes",
    //   roles: ["DIRECTOR DE DEPARTAMENTO"],
    // },
    // {
    //   path: "/matrix",
    //   name: "Matriz Evaluativa",
    //   roles: ["DIRECTOR DE DEPARTAMENTO"],
    // },
    // {
    //   path: "/subjects",
    //   name: "Materias",
    //   roles: ["DIRECTOR DE DEPARTAMENTO"],
    // },
    // {
    //   path: "/plans",
    //   name: "Planes de Mejoramiento",
    //   roles: ["DIRECTOR DE DEPARTAMENTO"],
    // },
    {
      path: "/admin/faculties",
      name: "Facultades",
      roles: ["ADMIN"],
    },
    {
      path: "/admin/departments",
      name: "Departamentos",
      roles: ["ADMIN"],
    },
    {
      path: "/admin/periods",
      name: "Períodos",
      roles: ["ADMIN"],
    },
    {
      path: "/admin/users",
      name: "Usuarios",
      roles: ["ADMIN"],
    },
    {
      path: "/admin/directors",
      name: "Directores",
      roles: ["ADMIN"],
    },
    {
      path: "/admin/documents",
      name: "Documentos",
      roles: ["ADMIN"],
    },
    {
      path: "/admin/settings",
      name: "Configuración",
      roles: ["ADMIN"],
    },
    {
      path: "/admin/logs",
      name: "Logs",
      roles: ["ADMIN"],
    },
  ],
};

/**
 * Returns the menus available for a given role.
 *
 * @param role The role to get the menus for.
 * @returns The menus available for the given role.
 */
export function getMenus(role: string): SecurityConfig["pages"] {
  return securityConfig.pages.filter((page) => page.roles.includes(role));
}

export type SecurityConfig = typeof securityConfig;

export default securityConfig;
