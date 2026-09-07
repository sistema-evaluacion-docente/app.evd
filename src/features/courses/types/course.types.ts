/** A course as returned by `GET /courses/`. */
export interface CourseRecord {
  id: number
  code: string
  name: string | null
  department_id: number | null
}

/** Payload for renaming a course via `PATCH /courses/{course_id}/name`. */
export interface UpdateCoursePayload {
  name: string
}
