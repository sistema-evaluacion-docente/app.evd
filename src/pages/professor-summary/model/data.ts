import type {
  TeacherCommentsData,
  TeacherVsDeptData,
} from '@/features/evaluations'
import type { TeacherHistoryEntry } from '@/features/teachers'

export type ProfessorRiskLevel = 'alto' | 'medio' | 'bajo'

export interface ProfessorQuestion {
  code: string
  text: string
  mine: number
  dept: number
}

export interface ProfessorComment {
  id: number
  text: string
  subject: string
  categoryId: string
  categoryName: string
  /** Null when the AI has not classified the comment yet. */
  risk: ProfessorRiskLevel | null
  confidence: number | null
}

export interface ProfessorCategory {
  id: string
  name: string
  score: number
  deptScore: number
  questions: ProfessorQuestion[]
  comments: ProfessorComment[]
}

export interface ProfessorLevel {
  label: string
  variant: 'success' | 'warning' | 'danger'
}

export interface ProfessorSummary {
  categories: ProfessorCategory[]
  comments: ProfessorComment[]
  overall: number
  deptOverall: number
  level: ProfessorLevel
}

export interface ProfessorPeriod {
  value: string
  label: string
  code: string
  periodId: number
  evaluationId: number
}

export const PROFESSOR_RISK_BADGE: Record<
  ProfessorRiskLevel,
  { label: string; variant: 'danger' | 'warning' | 'success' }
> = {
  alto: { label: 'Alto', variant: 'danger' },
  medio: { label: 'Medio', variant: 'warning' },
  bajo: { label: 'Bajo', variant: 'success' },
}

export function professorRiskBadge(risk: ProfessorRiskLevel | null): {
  label: string
  variant: 'danger' | 'warning' | 'success' | 'neutral'
} {
  return risk ? PROFESSOR_RISK_BADGE[risk] : { label: 'Sin clasificar', variant: 'neutral' }
}

export const professorScoreTone = (score: number) =>
  score >= 4.0 ? 'text-emerald-600' : score >= 3.5 ? 'text-amber-600' : 'text-red-600'

function levelFor(overall: number): ProfessorLevel {
  if (overall >= 4.3) return { label: 'Sobresaliente', variant: 'success' }
  if (overall >= 3.8) return { label: 'Destacado', variant: 'success' }
  if (overall >= 3.5) return { label: 'Aceptable', variant: 'warning' }
  return { label: 'Requiere mejora', variant: 'danger' }
}

/** Latest period first, so the select defaults to the most recent evaluation. */
export function mapProfessorPeriods(history: TeacherHistoryEntry[]): ProfessorPeriod[] {
  return [...history]
    .sort((a, b) => b.period_code.localeCompare(a.period_code))
    .map((entry) => ({
      value: String(entry.period_id),
      label: entry.period_name || `Periodo ${entry.period_code}`,
      code: entry.period_code,
      periodId: entry.period_id,
      evaluationId: entry.evaluation_id,
    }))
}

const normalize = (value: string) => value.trim().toLowerCase()

function mapRisk(name: string | undefined | null): ProfessorRiskLevel | null {
  if (!name) return null
  const key = normalize(name)
  return key === 'alto' || key === 'medio' || key === 'bajo' ? key : null
}

/** Scores may come as 0–1 ratios or 0–100 percentages; display always as %. */
function toPercent(value: number | null): number | null {
  if (value == null) return null
  return Math.round(value <= 1 ? value * 100 : value)
}

export function mapProfessorComments(data: TeacherCommentsData): ProfessorComment[] {
  return data.courses.flatMap((course) =>
    course.comments.map((comment) => ({
      id: comment.id,
      text: comment.original_text,
      subject: course.course_name || course.course_code,
      categoryId: comment.pedagogical_category
        ? String(comment.pedagogical_category.id)
        : 'sin-categoria',
      categoryName: comment.pedagogical_category?.name ?? 'Sin categoría',
      risk: mapRisk(comment.risk_level?.name),
      confidence: toPercent(comment.risk_score ?? comment.category_score),
    })),
  )
}

export function buildProfessorSummary(
  vsDept: TeacherVsDeptData,
  comments: ProfessorComment[],
  historyEntry: TeacherHistoryEntry | undefined,
): ProfessorSummary {
  const categories: ProfessorCategory[] = vsDept.dimensions.map((dimension) => ({
    id: dimension.dimension,
    name: dimension.dimension,
    score: dimension.teacher_average,
    deptScore: dimension.department_average,
    questions: dimension.questions.map((question) => ({
      code: question.code,
      text: question.text,
      mine: question.teacher_average,
      dept: question.department_average,
    })),
    // The AI's pedagogical categories are matched to dimensions by name; a
    // comment whose category has no matching dimension only shows in the table.
    comments: comments.filter(
      (comment) => normalize(comment.categoryName) === normalize(dimension.dimension),
    ),
  }))

  const overall =
    historyEntry?.overall_average ??
    (categories.length > 0
      ? categories.reduce((sum, category) => sum + category.score, 0) / categories.length
      : 0)

  return {
    categories,
    comments,
    overall,
    deptOverall: vsDept.department_overall_average,
    level: levelFor(overall),
  }
}
