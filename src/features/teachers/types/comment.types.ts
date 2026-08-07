/** Risk classification assigned to a comment by the AI analysis. */
export interface CommentRiskLevel {
  id: number
  name: string
  /** Hex color (`#rrggbb`) used to tint the risk badge. */
  color_hex: string
}

/** Pedagogical category a comment was classified into. */
export interface CommentPedagogicalCategory {
  id: number
  name: string
  description: string
  /** Hex color (`#rrggbb`) used to tint the category badge. */
  color_hex: string
}

/** A single student comment about a teacher, already analyzed by the backend. */
export interface TeacherComment {
  id: number
  teacher_id: number
  evaluation_id: number
  academic_groups_id: number
  group_name: string
  teacher_name: string
  teacher_avatar_url: string
  course_name: string
  /** Verbatim text written by the student. */
  original_text: string
  risk_level: CommentRiskLevel
  /** Numeric risk assigned to the comment. */
  risk_score: number
  pedagogical_category: CommentPedagogicalCategory
  /** Confidence/relevance of the assigned pedagogical category. */
  category_score: number
  created_at: string
  updated_at: string
}

/** Comments grouped by the course/group they belong to. */
export interface TeacherCommentsCourse {
  course_code: string
  course_name: string
  group_name: string
  comments: TeacherComment[]
}

/**
 * Payload of `GET /evaluations/{evaluation_id}/teachers/{teacher_id}/comments`.
 */
export interface TeacherCommentsData {
  teacher_id: number
  evaluation_id: number
  courses: TeacherCommentsCourse[]
}
