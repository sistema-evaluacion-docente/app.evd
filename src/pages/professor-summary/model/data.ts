import type {
  TeacherCommentsData,
  TeacherEvaluationDetail,
  TeacherVsDeptData,
  TeacherVsDeptDimension,
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

export interface ProfessorHistoryPoint {
  periodId: number
  code: string
  name: string
  value: number
}

/** One semester's teacher-vs-department score for a single category. */
export interface CategoryHistoryPoint {
  periodId: number
  code: string
  name: string
  mine: number
  dept: number
}

/** One item's (question's) score in a single semester. */
export interface CategoryItemPeriodScore {
  periodId: number
  code: string
  mine: number
  dept: number
}

/** A category question tracked across every semester it appears in. */
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

export function mapProfessorHistory(
  history: TeacherHistoryEntry[],
): ProfessorHistoryPoint[] {
  return [...history]
    .sort((a, b) => a.period_code.localeCompare(b.period_code))
    .map((entry) => ({
      periodId: entry.period_id,
      code: entry.period_code,
      name: entry.period_name || `Periodo ${entry.period_code}`,
      value: entry.overall_average,
    }))
}

/**
 * Rebuilds a per-category history from one teacher-vs-department response per
 * period. Only periods that actually contain the category are kept, sorted
 * oldest → newest. Produces both the two-line chart series (`points`) and the
 * item-by-item series (`items`), from the same source.
 */
export function buildCategoryHistory(
  entries: { period: ProfessorPeriod; data: TeacherVsDeptData | undefined }[],
  categoryId: string,
): CategoryHistory {
  const target = normalize(categoryId)

  const matched = entries
    .map((entry) => ({
      period: entry.period,
      dimension: entry.data?.dimensions.find(
        (dim) => normalize(dim.dimension) === target,
      ),
    }))
    .filter(
      (
        entry,
      ): entry is { period: ProfessorPeriod; dimension: TeacherVsDeptDimension } =>
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

  // Item order follows the most recent semester; items seen only in older
  // semesters are appended so nothing disappears from the comparison.
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

// ---------------------------------------------------------------------------
// Notas por materia (subject-level breakdown)
// ---------------------------------------------------------------------------

/** One question's score within a subject's category (no department benchmark). */
export interface ProfessorSubjectQuestion {
  code: string
  text: string
  score: number
}

/** A category (dimension) scored for a single subject. No department average
 * exists per subject, so only the teacher's own score is kept. */
export interface ProfessorSubjectCategory {
  id: string
  name: string
  score: number
  questions: ProfessorSubjectQuestion[]
}

/** A subject (course + group) the teacher was evaluated on, with its own
 * overall grade and per-category breakdown. */
export interface ProfessorSubject {
  /** Stable id for selection (`course_code__group_name`). */
  key: string
  code: string
  name: string
  group: string
  respondents: number
  score: number
  categories: ProfessorSubjectCategory[]
}

/** Builds the per-subject list from a teacher's evaluation detail. */
export function mapProfessorSubjects(detail: TeacherEvaluationDetail): ProfessorSubject[] {
  return detail.courses.map((course) => ({
    key: `${course.course_code}__${course.group_name}`,
    code: course.course_code,
    name: course.course_name,
    group: course.group_name,
    respondents: course.respondent_count,
    score: course.overall_average,
    categories: course.dimensions.map((dimension) => ({
      id: dimension.dimension,
      name: dimension.dimension,
      score: dimension.average,
      questions: (dimension.questions ?? []).map((question) => ({
        code: question.code,
        text: question.text,
        score: question.score,
      })),
    })),
  }))
}

/** Finds a subject's category by name (matched normalized, like the summary). */
export function findSubjectCategory(
  subject: ProfessorSubject,
  categoryName: string,
): ProfessorSubjectCategory | undefined {
  const target = normalize(categoryName)
  return subject.categories.find((category) => normalize(category.name) === target)
}

// ---------------------------------------------------------------------------
// Comparación por materia / comentarios entre semestres (Parte C)
// ---------------------------------------------------------------------------

/** One subject's grade in a single semester. */
export interface SubjectPeriodScore {
  code: string
  score: number
}

/** A subject tracked across every semester it was taught. */
export interface SubjectGradeHistory {
  key: string
  name: string
  group: string
  byPeriod: SubjectPeriodScore[]
}

/** All the comments of a single semester. */
export interface PeriodComments {
  periodId: number
  code: string
  name: string
  comments: ProfessorComment[]
}

export interface SubjectHistory {
  subjects: SubjectGradeHistory[]
  commentsByPeriod: PeriodComments[]
}

/**
 * Rebuilds, across every evaluated semester, both the per-subject overall grade
 * (from each period's evaluation detail) and the semester's comments. Subject
 * order follows the most recent semester; subjects seen only in older semesters
 * are appended so nothing disappears.
 */
export function buildSubjectHistory(
  entries: {
    period: ProfessorPeriod
    detail: TeacherEvaluationDetail | undefined
    comments: ProfessorComment[]
  }[],
): SubjectHistory {
  const sorted = [...entries].sort((a, b) => a.period.code.localeCompare(b.period.code))

  const order: string[] = []
  const meta = new Map<string, { name: string; group: string }>()
  for (let i = sorted.length - 1; i >= 0; i--) {
    for (const course of sorted[i].detail?.courses ?? []) {
      const key = `${course.course_code}__${course.group_name}`
      if (!meta.has(key)) {
        meta.set(key, { name: course.course_name, group: course.group_name })
        order.push(key)
      }
    }
  }

  const subjects: SubjectGradeHistory[] = order.map((key) => ({
    key,
    name: meta.get(key)!.name,
    group: meta.get(key)!.group,
    byPeriod: sorted
      .map(({ period, detail }) => {
        const course = detail?.courses.find(
          (item) => `${item.course_code}__${item.group_name}` === key,
        )
        return course ? { code: period.code, score: course.overall_average } : null
      })
      .filter((score): score is SubjectPeriodScore => score != null),
  }))

  const commentsByPeriod: PeriodComments[] = sorted.map(({ period, comments }) => ({
    periodId: period.periodId,
    code: period.code,
    name: period.label,
    comments,
  }))

  return { subjects, commentsByPeriod }
}
