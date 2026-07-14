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
      path: "/my-plans",
      name: "Mi Plan de Mejora",
      roles: ["DOCENTE"],
    },
    {
      path: "/evaluations",
      name: "Evaluaciones",
      roles: ["DIRECTOR DE DEPARTAMENTO"],
    },
    {
      path: "/teachers",
      name: "Docentes",
      roles: ["DIRECTOR DE DEPARTAMENTO"],
    },
    {
      path: "/matrix",
      name: "Matriz Evaluativa",
      roles: ["DIRECTOR DE DEPARTAMENTO"],
    },
    {
      path: "/subjects",
      name: "Materias",
      roles: ["DIRECTOR DE DEPARTAMENTO"],
    },
    {
      path: "/plans",
      name: "Planes de Mejoramiento",
      roles: ["DIRECTOR DE DEPARTAMENTO"],
    },
    {
      path: "/faculties",
      name: "Facultades",
      roles: ["ADMIN"],
    },
    {
      path: "/departments",
      name: "Departamentos",
      roles: ["ADMIN"],
    },
    {
      path: "/periods",
      name: "Períodos",
      roles: ["ADMIN"],
    },
    {
      path: "/users",
      name: "Usuarios",
      roles: ["ADMIN"],
    },
    {
      path: "/documents",
      name: "Documentos",
      roles: ["ADMIN"],
    },
    {
      path: "/settings",
      name: "Configuración",
      roles: ["ADMIN"],
    },
    {
      path: "/logs",
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
