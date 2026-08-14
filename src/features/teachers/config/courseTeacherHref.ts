/**
 * Builds the route to a director's read of one teacher's results in one
 * subject ("materia") for one period, identified by course code + group
 * name (courses have no numeric id at this level — same identity model
 * already used by the teacher-facing materia routes). Lives in `teachers`
 * (not `subjects`) so both `teachers` and `subjects` can depend on it
 * without creating a circular feature dependency.
 *
 * @example
 * courseTeacherHref('SIS101', 12, '2025-1', 'A')
 * // '/materias/SIS101/docentes/12?period=2025-1&group=A'
 */
export function courseTeacherHref(
  courseCode: string,
  teacherId: number,
  period: string,
  groupName: string,
): string {
  const query = new URLSearchParams({ period, group: groupName })

  return `/materias/${encodeURIComponent(courseCode)}/docentes/${teacherId}?${query.toString()}`
}
