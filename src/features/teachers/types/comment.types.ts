import type { AiStatus } from '@/features/evaluations'

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

/** A pedagogical category assigned to a comment, with its confidence score. */
export interface CommentPedagogicalCategoryScore extends CommentPedagogicalCategory {
  /** Confidence/relevance of this assigned pedagogical category. */
  score: number
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
  /** A comment can be classified into several pedagogical categories at once. */
  pedagogical_categories: CommentPedagogicalCategoryScore[]
  /** `true` once a director has overridden the AI-assigned risk level. */
  risk_level_modified_by_director?: boolean
  /** `true` once a director has overridden the AI-assigned pedagogical category. */
  pedagogical_category_modified_by_director?: boolean
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
  /** Whether the AI has finished classifying these comments by risk/category yet. */
  ai_status: AiStatus | null
  courses: TeacherCommentsCourse[]
}
