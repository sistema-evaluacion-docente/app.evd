import type { TeacherComment, TeacherCommentsCourse } from '@/features/teachers/types'
import { courseKey } from './indicatorMatrix'

/**
 * The AI classifies every student comment into a pedagogical category that
 * mirrors one of the four evaluation dimensions (`LABEL_4` is the model's
 * "no category" bucket). Mapping them lets a comment be read next to the
 * indicators it talks about.
 */
export const CATEGORY_DIMENSION: Record<string, string> = {
  LABEL_0: 'Desarrollo del Conocimiento',
  LABEL_1: 'Desempeño Docente',
  LABEL_2: 'Procesos de Evaluación',
  LABEL_3: 'Integración Interpersonal',
}

/** Aspect 5 of the official forms — "Observaciones de los Estudiantes". */
export const STUDENT_COMMENTS_ASPECT = 5

/** Medium and high risk: what the module treats as worth acting on. */
export function isRiskyComment(comment: TeacherComment): boolean {
  const name = comment.risk_level?.name?.toUpperCase()

  if (name) return name === 'MEDIO' || name === 'ALTO'

  // Ids of `RISK_LEVELS`: 1 Bajo, 2 Medio, 3 Alto.
  return (comment.risk_level?.id ?? 0) >= 2
}

export interface GroupedComments {
  /** Keyed by dimension name, matching `IndicatorDimension.dimension`. */
  byDimension: Record<string, TeacherComment[]>
  /** Comments the model could not place in any of the four dimensions. */
  uncategorized: TeacherComment[]
}

/**
 * Groups the comments of a teacher under the dimension each one talks about,
 * optionally narrowed to a single subject.
 *
 * A comment classified into several categories is listed under each of them —
 * it is one comment discussing several things, and citing it from any of those
 * places refers to the same `comment_id`.
 *
 * @example
 * const { byDimension, uncategorized } = groupComments(data.courses, subjectKey)
 */
export function groupComments(
  courses: TeacherCommentsCourse[] | undefined,
  subjectKey?: string | null,
): GroupedComments {
  const byDimension: Record<string, TeacherComment[]> = {}
  const uncategorized: TeacherComment[] = []

  for (const course of courses ?? []) {
    if (subjectKey && courseKey(course) !== subjectKey) continue

    for (const comment of course.comments) {
      const dimensions = new Set(
        (comment.pedagogical_categories ?? [])
          .map((category) => CATEGORY_DIMENSION[category.name?.toUpperCase() ?? ''])
          .filter((dimension): dimension is string => Boolean(dimension)),
      )

      if (dimensions.size === 0) {
        uncategorized.push(comment)
        continue
      }

      for (const dimension of dimensions) {
        byDimension[dimension] = [...(byDimension[dimension] ?? []), comment]
      }
    }
  }

  return { byDimension, uncategorized }
}

/** Comments of one dimension, honouring the "solo indicadores bajos" filter. */
export function visibleComments(
  comments: TeacherComment[] | undefined,
  onlyRisky: boolean,
): TeacherComment[] {
  if (!comments) return []

  return onlyRisky ? comments.filter(isRiskyComment) : comments
}

/** Whether a subject has anything worth showing when filtering by risk. */
export function countRisky(grouped: GroupedComments): number {
  const all = [...Object.values(grouped.byDimension).flat(), ...grouped.uncategorized]

  return new Set(all.filter(isRiskyComment).map((comment) => comment.id)).size
}
