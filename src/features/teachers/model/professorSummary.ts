import type {
  TeacherCommentsData,
  TeacherVsDeptData,
  TeacherVsDeptDimension,
} from '@/features/evaluations'
import type { TeacherHistoryEntry } from '@/features/teachers/types/Teacher'

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

export interface ProfessorHistoryPoint {
  periodId: number
  code: string
  name: string
  value: number
}

export interface CategoryHistoryPoint {
  periodId: number
  code: string
  name: string
  mine: number
  dept: number
}

export interface CategoryItemPeriodScore {
  periodId: number
  code: string
  mine: number
  dept: number
}

export interface CategoryItemHistory {
  code: string
  text: string
  byPeriod: CategoryItemPeriodScore[]
}

export interface CategoryHistory {
  points: CategoryHistoryPoint[]
  items: CategoryItemHistory[]
}

export const PROFESSOR_RISK_BADGE: Record<
  ProfessorRiskLevel,
  { label: string; variant: 'destructive' | 'outline' | 'secondary' | 'ghost' }
> = {
  alto: { label: 'Alto', variant: 'destructive' },
  medio: { label: 'Medio', variant: 'outline' },
  bajo: { label: 'Bajo', variant: 'secondary' },
}

export function professorRiskBadge(risk: ProfessorRiskLevel | null): {
  label: string
  variant: 'destructive' | 'outline' | 'secondary' | 'ghost'
} {
  return risk ? PROFESSOR_RISK_BADGE[risk] : { label: 'Sin clasificar', variant: 'ghost' }
}

export const professorScoreTone = (score: number) =>
  score >= 4.0 ? 'text-emerald-600' : score >= 3.5 ? 'text-amber-600' : 'text-red-600'

export const normalize = (value: string) => value.trim().toLowerCase()

function levelFor(overall: number): ProfessorLevel {
  if (overall >= 4.3) return { label: 'Sobresaliente', variant: 'success' }
  if (overall >= 3.8) return { label: 'Destacado', variant: 'success' }
  if (overall >= 3.5) return { label: 'Aceptable', variant: 'warning' }
  return { label: 'Requiere mejora', variant: 'danger' }
}

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

export function mapProfessorHistory(history: TeacherHistoryEntry[]): ProfessorHistoryPoint[] {
  return [...history]
    .sort((a, b) => a.period_code.localeCompare(b.period_code))
    .map((entry) => ({
      periodId: entry.period_id,
      code: entry.period_code,
      name: entry.period_name || `Periodo ${entry.period_code}`,
      value: entry.overall_average,
    }))
}

export function buildCategoryHistory(
  entries: { period: ProfessorPeriod; data: TeacherVsDeptData | undefined }[],
  categoryId: string,
): CategoryHistory {
  const target = normalize(categoryId)

  const matched = entries
    .map((entry) => ({
      period: entry.period,
      dimension: entry.data?.dimensions.find((dim) => normalize(dim.dimension) === target),
    }))
    .filter(
      (entry): entry is { period: ProfessorPeriod; dimension: TeacherVsDeptDimension } =>
        entry.dimension != null,
    )
    .sort((a, b) => a.period.code.localeCompare(b.period.code))

  const points: CategoryHistoryPoint[] = matched.map(({ period, dimension }) => ({
    periodId: period.periodId,
    code: period.code,
    name: period.label,
    mine: dimension.teacher_average,
    dept: dimension.department_average,
  }))

  const order: string[] = []
  const texts = new Map<string, string>()
  for (let i = matched.length - 1; i >= 0; i--) {
    for (const question of matched[i].dimension.questions) {
      if (!texts.has(question.code)) {
        texts.set(question.code, question.text)
        order.push(question.code)
      }
    }
  }

  const items: CategoryItemHistory[] = order.map((code) => ({
    code,
    text: texts.get(code) ?? code,
    byPeriod: matched
      .map(({ period, dimension }) => {
        const question = dimension.questions.find((item) => item.code === code)
        return question
          ? {
              periodId: period.periodId,
              code: period.code,
              mine: question.teacher_average,
              dept: question.department_average,
            }
          : null
      })
      .filter((score): score is CategoryItemPeriodScore => score != null),
  }))

  return { points, items }
}

function mapRisk(name: string | undefined | null): ProfessorRiskLevel | null {
  if (!name) return null
  const key = normalize(name)
  return key === 'alto' || key === 'medio' || key === 'bajo' ? key : null
}

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
      categoryName: comment.pedagogical_category?.name ?? 'Sin categoria',
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
