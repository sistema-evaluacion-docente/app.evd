/**
 * Builds the route to a subject's ("materia") own detail page within one of
 * the teacher's periods, identified by course code + group name (the same
 * pair `TeacherCourseResults` already uses as a row key, since courses have
 * no numeric id at this level).
 *
 * @example
 * courseHref('2025-1', 'SIS101', 'A') // '/periodos/2025-1/materias/SIS101/A'
 */
export function courseHref(period: string, courseCode: string, groupName: string): string {
  const encodedPeriod = encodeURIComponent(period)
  const encodedCourse = encodeURIComponent(courseCode)
  const encodedGroup = encodeURIComponent(groupName)

  return `/periodos/${encodedPeriod}/materias/${encodedCourse}/${encodedGroup}`
}
