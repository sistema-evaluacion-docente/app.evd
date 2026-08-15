/** A course as returned by `GET /courses/`. */
export interface CourseRecord {
  id: number
  code: string
  name: string | null
  department_id: number | null
}

/** Payload for updating a course's name via `PUT /courses/{course_id}`. */
export interface UpdateCoursePayload {
  name: string
}
