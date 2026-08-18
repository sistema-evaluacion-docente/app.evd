import type { DimensionDetail } from '@/features/teachers/types'
import type { IndicatorDimension, IndicatorQuestion, PlanIndicators } from '../types'

/** Sentinel of the subject filter: every group of the teacher at once. */
export const SUBJECT_ALL = 'GENERAL'

/**
 * Identity of one subject of a teacher in a period. A "materia" is a
 * course *and* group, because that is the granularity the evaluation is
 * aggregated at and the one the official form prints.
 */
export function courseKey(course: {
  course_code?: string | null
  group_name?: string | null
}): string {
  return `${course.course_code ?? ''}::${course.group_name ?? ''}`
}

/** "PROGRAMACIÓN I · Grupo A" */
export function courseLabel(course: {
  course_name?: string | null
  course_code?: string | null
  group_name?: string | null
}): string {
  const name = course.course_name ?? course.course_code ?? 'Asignatura'

  return course.group_name ? `${name} · Grupo ${course.group_name}` : name
}

/**
 * Rebuilds the shape `IndicatorPicker` renders from the per-subject scores of
 * `GET /evaluations/teachers/{id}/detail`, which has averages but neither the
 * threshold flags nor the suggested actions.
 *
 * The catalogue (`GET /improvement-plans/indicators`) drives the iteration, so
 * the four dimensions always come out in the order of the official form even if
 * a subject was not asked every question.
 *
 * @example
 * const dimensions = buildDimensionsFromDetail(course.dimensions, indicators, 3.5)
 */
export function buildDimensionsFromDetail(
  source: DimensionDetail[] | undefined,
  catalogue: PlanIndicators | undefined,
  threshold: number,
): IndicatorDimension[] {
  if (!catalogue) return []

  return catalogue.dimensions.map((entry) => {
    const scored = source?.find((item) => item.dimension === entry.dimension)

    const questions: IndicatorQuestion[] = entry.questions.map((question) => {
      const average = scored?.questions.find((item) => item.code === question.code)?.score ?? null

      return {
        target_type: 'QUESTION',
        target_ref: question.target_ref,
        code: question.code,
        text: question.text,
        average,
        below_threshold: average != null && average <= threshold,
        suggestions: question.suggestions,
      }
    })

    const average = scored?.average ?? averageOf(questions)

    return {
      dimension: entry.dimension,
      target_type: 'DIMENSION',
      target_ref: entry.target_ref,
      average,
      below_threshold: average != null && average <= threshold,
      suggestions: entry.suggestions,
      questions,
    }
  })
}

function averageOf(questions: IndicatorQuestion[]): number | null {
  const scores = questions
    .map((question) => question.average)
    .filter((score): score is number => score != null)

  if (scores.length === 0) return null

  return scores.reduce((total, score) => total + score, 0) / scores.length
}

/** How many indicators (dimensions + questions) sit below the threshold. */
export function countWeak(dimensions: IndicatorDimension[]): number {
  return dimensions.reduce(
    (total, dimension) =>
      total +
      (dimension.below_threshold ? 1 : 0) +
      dimension.questions.filter((question) => question.below_threshold).length,
    0,
  )
}

/** Whether anything in the matrix is below the threshold. */
export function hasWeakIndicators(dimensions: IndicatorDimension[]): boolean {
  return dimensions.some(
    (dimension) =>
      dimension.below_threshold || dimension.questions.some((question) => question.below_threshold),
  )
}
