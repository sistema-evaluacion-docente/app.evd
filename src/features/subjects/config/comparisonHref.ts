/**
 * Builds the route to the director's side-by-side comparison of every
 * teacher who taught a subject ("materia") in a period. `courseName` isn't
 * returned by the comparison endpoint, so it's carried through the URL from
 * wherever the caller already has it (e.g. the materias list) instead of
 * asking the API for it.
 *
 * @example
 * subjectComparisonHref('1155304', '2025-1', 'Cálculo I')
 * // '/materias/1155304/comparar?period=2025-1&name=C%C3%A1lculo%20I'
 */
export function subjectComparisonHref(
  courseCode: string,
  period: string,
  courseName: string,
): string {
  const query = new URLSearchParams({ period, name: courseName })

  return `/materias/${encodeURIComponent(courseCode)}/comparar?${query.toString()}`
}
