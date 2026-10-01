/** Search param of `/admin/usuarios` that narrows the list to one department. */
export const DEPARTMENT_FILTER_PARAM = 'departamento'

/**
 * Builds the route to the admin users list narrowed to one department's users
 * (those who teach in it or direct it). Lives in `users` so `departments` can
 * link to it without knowing the param name.
 *
 * @example
 * usersOfDepartmentHref(7) // '/admin/usuarios?departamento=7'
 */
export function usersOfDepartmentHref(departmentId: number): string {
  return `/admin/usuarios?${DEPARTMENT_FILTER_PARAM}=${departmentId}`
}

/**
 * Reads the department id from the search param: a positive integer, or
 * `undefined` for anything else (e.g. a hand-typed `?departamento=abc`), so a
 * bad value is ignored rather than forwarded to the API.
 *
 * @example
 * parseDepartmentId('7') // 7
 * parseDepartmentId('abc') // undefined
 */
export function parseDepartmentId(value: string | null): number | undefined {
  const id = Number(value)

  return Number.isInteger(id) && id > 0 ? id : undefined
}
