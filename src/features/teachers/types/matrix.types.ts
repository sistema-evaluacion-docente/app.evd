/** One course in a teacher's question matrix, with the group already appended to the name. */
export interface TeacherMatrixCourse {
  course_name: string
  /** Average score per question code; a code is absent when that group had no data for it. */
  question_averages: Record<string, number>
  overall_average: number
}

/** Payload of `GET /stats/teachers/{teacher_id}/matrix`. */
export interface TeacherMatrix {
  teacher_id: number
  evaluation_id: number
  courses: TeacherMatrixCourse[]
  /** Average of each question across every course in `courses`. */
  column_averages: Record<string, number>
}
