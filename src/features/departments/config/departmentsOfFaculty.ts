/** Search param of `/admin/departamentos` that narrows the list to one faculty. */
export const FACULTY_FILTER_PARAM = 'facultad'

/**
 * Builds the route to the admin departments list narrowed to one faculty's
 * departments. Lives in `departments` so `faculties` can link to it without
 * knowing the param name.
 *
 * @example
 * departmentsOfFacultyHref(2) // '/admin/departamentos?facultad=2'
 */
export function departmentsOfFacultyHref(facultyId: number): string {
  return `/admin/departamentos?${FACULTY_FILTER_PARAM}=${facultyId}`
}

/**
 * Reads the faculty id from the search param: a positive integer, or
 * `undefined` for anything else (e.g. a hand-typed `?facultad=abc`), so a bad
 * value is ignored rather than forwarded to the API.
 *
 * @example
 * parseFacultyId('2') // 2
 * parseFacultyId('abc') // undefined
 */
export function parseFacultyId(value: string | null): number | undefined {
  const id = Number(value)

  return Number.isInteger(id) && id > 0 ? id : undefined
}
