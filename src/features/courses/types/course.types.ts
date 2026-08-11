/** A course as returned by `GET /courses/`. */
export interface CourseRecord {
  id: number
  code: string
  name: string | null
  department_id: number | null
}
