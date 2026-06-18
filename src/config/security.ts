const securityConfig = {
  pages: [
    {
      path: "/dashboard",
      name: "Dashboard",
      roles: ["DOCENTE", "DIRECTOR DE DEPARTAMENTO"],
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
      path: "/plans",
      name: "Planes de Mejoramiento",
      roles: ["DIRECTOR DE DEPARTAMENTO"],
    },
    {
      path: "/dashboard",
      name: "Inicio",
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
