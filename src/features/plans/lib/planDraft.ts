import type { TeacherComment } from '@/features/teachers/types'
import type {
  DraftCourse,
  DraftItem,
  IndicatorDimension,
  IndicatorQuestion,
  PlanCourse,
  PlanCourseInput,
  PlanIndicators,
  PlanItem,
  PlanSubjectOption,
  TargetType,
} from '../types'
import { STUDENT_COMMENTS_ASPECT } from './commentGroups'
import { courseKey, SUBJECT_ALL } from './indicatorMatrix'
import { indicatorKey } from './planStatus'

/**
 * Key of a drafted row, unique for as long as the form is open.
 *
 * Random and not a running counter: a counter starts over on every page load,
 * so a commitment restored from a saved draft came back holding a key the next
 * one would be handed again — and two rows sharing a key means editing one
 * edits the other. Guarding against that took a reservation pass over the
 * restored rows, run from the middle of a render; drawing the key out of thin
 * air removes both.
 */
function nextKey(): string {
  // `randomUUID` is only there in a secure context. The app is served over one,
  // but a plain-http preview must not lose the form over it.
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `draft-${crypto.randomUUID()}`
  }

  return `draft-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Identity of a pick. The subject takes part in it so the same dimension read
 * on two subjects yields two commitments — `target_ref` stays clean because
 * the API verifies compliance through it.
 */
export function indicatorSelectionId(
  subjectKey: string | null,
  targetType: TargetType,
  targetRef: string | null,
): string {
  return `${subjectKey ?? SUBJECT_ALL}::${indicatorKey(targetType, targetRef)}`
}

/** A comment is the same citation wherever it is picked from. */
export function commentSelectionId(commentId: number): string {
  return `COMMENT::${commentId}`
}

/** Identity of an asignatura row, preferring the group id when it is known. */
export function courseRowKey(course: PlanCourseInput): string {
  if (course.academic_group_id != null) return `group:${course.academic_group_id}`

  return `code:${course.course_code ?? ''}::${course.group_name ?? ''}`
}

/** Adds the subjects a pick contributes, without touching what is already there. */
export function mergeCourses(current: DraftCourse[], incoming: PlanCourseInput[]): DraftCourse[] {
  const known = new Set(current.map((course) => course.key))
  const added = incoming
    .filter((course) => !known.has(courseRowKey(course)))
    .map<DraftCourse>((course) => ({
      ...course,
      key: courseRowKey(course),
      origin: 'auto',
    }))

  return reorder([...current, ...added])
}

/**
 * Drops the `auto` rows no remaining commitment justifies. Rows the director
 * typed or edited by hand are left alone — they were never ours to remove.
 */
export function pruneCourses(current: DraftCourse[], items: DraftItem[]): DraftCourse[] {
  // A teacher-level commitment justifies every asignatura of the plan.
  if (items.some((item) => item.source_subject_key == null)) return current

  const referenced = new Set(items.map((item) => item.source_subject_key))

  return reorder(
    current.filter((course) => course.origin === 'manual' || referenced.has(courseKey(course))),
  )
}

function reorder(courses: DraftCourse[]): DraftCourse[] {
  return courses.map((course, index) => ({ ...course, order: index }))
}

/** The asignatura row a subject of the teacher becomes. */
export function courseOfSubject(option: PlanSubjectOption): PlanCourseInput {
  return {
    academic_group_id: option.academic_group_id,
    course_name: option.course_name,
    course_code: option.course_code,
    group_name: option.group_name,
  }
}

/** The subjects an `option` contributes to the plan when something is picked. */
export function coursesOfSubject(
  subject: PlanSubjectOption | null,
  all: PlanSubjectOption[],
): PlanCourseInput[] {
  return (subject ? [subject] : all).map(courseOfSubject)
}

/** The subject a comment came from, so citing it also lists its asignatura. */
export function subjectOfComment(
  comment: TeacherComment,
  options: PlanSubjectOption[],
): PlanSubjectOption | null {
  return (
    options.find((option) => option.academic_group_id === comment.academic_groups_id) ??
    options.find(
      (option) =>
        option.course_name === comment.course_name && option.group_name === comment.group_name,
    ) ??
    null
  )
}

export interface IndicatorPick {
  target_type: Extract<TargetType, 'DIMENSION' | 'QUESTION'>
  target_ref: string
  label: string
  average: number | null
  aspect: number | null
  suggestions: string[]
}

/** What the picker hands over when a dimension or a question is added. */
export function indicatorPickOf(
  dimension: IndicatorDimension,
  aspect: number | null,
): IndicatorPick {
  return {
    target_type: 'DIMENSION',
    target_ref: dimension.target_ref,
    label: dimension.dimension,
    average: dimension.average,
    aspect,
    suggestions: dimension.suggestions,
  }
}

export function questionPickOf(question: IndicatorQuestion, aspect: number | null): IndicatorPick {
  return {
    target_type: 'QUESTION',
    target_ref: question.target_ref,
    label: `${question.code} · ${question.text}`,
    average: question.average,
    aspect,
    suggestions: question.suggestions,
  }
}

/**
 * Builds the commitment an indicator pick becomes.
 *
 * `target_value` is left empty on purpose: seeded with the institutional
 * threshold it read as already decided, and the director scrolled past it. The
 * form now asks for it, and the API falls back to the threshold if it never
 * arrives.
 */
export function buildIndicatorDraft(
  pick: IndicatorPick,
  subject: PlanSubjectOption | null,
): DraftItem {
  const score = pick.average != null ? ` (${pick.average.toFixed(2)})` : ''
  const scope = subject ? ` — ${subject.label}` : ''

  return {
    key: nextKey(),
    selection_id: indicatorSelectionId(subject?.key ?? null, pick.target_type, pick.target_ref),
    description: `${pick.label}${scope}${score}`,
    commitment: '',
    aspect: pick.aspect,
    target_type: pick.target_type,
    target_ref: pick.target_ref,
    baseline_value: pick.average,
    target_value: null,
    suggestions: pick.suggestions,
    comment_ids: [],
    comment_previews: [],
    source_subject_key: subject?.key ?? null,
    source_subject_label: subject?.label ?? null,
  }
}

/**
 * Builds the commitment a student comment becomes. It always lands on aspect 5
 * ("Observaciones de los Estudiantes"), the section the official form reserves
 * for them, and cites the comment so Formato 2 prints it verbatim.
 */
export function buildCommentDraft(
  comment: TeacherComment,
  subject: PlanSubjectOption | null,
): DraftItem {
  const risk = comment.risk_level?.name?.toLowerCase() ?? 'sin clasificar'
  const course = comment.course_name
    ? ` · ${comment.course_name}${comment.group_name ? ` (Grupo ${comment.group_name})` : ''}`
    : ''

  return {
    key: nextKey(),
    selection_id: commentSelectionId(comment.id),
    description: `Observación de estudiantes${course} · riesgo ${risk}`,
    commitment: '',
    aspect: STUDENT_COMMENTS_ASPECT,
    target_type: 'QUALITATIVE',
    target_ref: null,
    baseline_value: null,
    target_value: null,
    suggestions: [],
    comment_ids: [comment.id],
    comment_previews: [
      {
        id: comment.id,
        text: comment.original_text,
        risk_level_name: comment.risk_level?.name ?? null,
      },
    ],
    source_subject_key: subject?.key ?? null,
    source_subject_label: subject?.label ?? null,
  }
}

/** An empty qualitative commitment the director writes from scratch. */
export function buildBlankDraft(aspect: number): DraftItem {
  return {
    key: nextKey(),
    selection_id: nextKey(),
    description: '',
    commitment: '',
    aspect,
    target_type: 'QUALITATIVE',
    target_ref: null,
    baseline_value: null,
    target_value: null,
    suggestions: [],
    comment_ids: [],
    comment_previews: [],
    source_subject_key: null,
    source_subject_label: null,
  }
}

/* -------------------------------------------------------------------------- */
/* Seeding the workbench from a saved plan                                     */
/* -------------------------------------------------------------------------- */

/** Suggested actions of an indicator, which the plan itself doesn't store. */
function suggestionsOf(
  catalogue: PlanIndicators | undefined,
  targetType: TargetType,
  targetRef: string | null,
): string[] {
  if (!catalogue || targetRef == null) return []

  if (targetType === 'DIMENSION') {
    return catalogue.dimensions.find((entry) => entry.target_ref === targetRef)?.suggestions ?? []
  }

  if (targetType === 'QUESTION') {
    for (const dimension of catalogue.dimensions) {
      const question = dimension.questions.find((entry) => entry.target_ref === targetRef)

      if (question) return question.suggestions
    }
  }

  return []
}

/**
 * Turns the commitments of a saved plan back into editable drafts.
 *
 * `id` travels with every row on purpose: the API replaces the whole list on
 * update, so a row that comes back without one is recreated — losing the
 * evidences and the verified result attached to it — and a row left out is
 * deleted outright.
 *
 * The subject an indicator was picked under is not persisted, so the drafts
 * come back at teacher level and the picker matches them by indicator alone.
 *
 * @example
 * const [items] = useState(() => planItemsToDrafts(plan.items, indicators))
 */
export function planItemsToDrafts(items: PlanItem[], catalogue?: PlanIndicators): DraftItem[] {
  return [...items]
    .sort((a, b) => a.order - b.order)
    .map((item) => {
      const commentIds = item.comments.map((comment) => comment.comment_id)

      return {
        key: nextKey(),
        selection_id:
          commentIds.length > 0
            ? commentSelectionId(commentIds[0])
            : item.target_ref != null
              ? indicatorSelectionId(null, item.target_type, item.target_ref)
              : nextKey(),
        id: item.id,
        description: item.description,
        commitment: item.commitment ?? '',
        aspect: item.aspect,
        target_type: item.target_type,
        target_ref: item.target_ref,
        baseline_value: item.baseline_value,
        target_value: item.target_value,
        status: item.status,
        suggestions: suggestionsOf(catalogue, item.target_type, item.target_ref),
        comment_ids: commentIds,
        comment_previews: item.comments.map((comment) => ({
          id: comment.comment_id,
          text: comment.original_text ?? '',
          risk_level_name: comment.risk_level_name,
        })),
        source_subject_key: null,
        source_subject_label: null,
      }
    })
}

/**
 * Turns the asignaturas of a saved plan back into editable rows.
 *
 * Every row is `manual`: it is already part of the agreement, so unpicking the
 * commitment that once brought it in must not take it back out. Rows sharing an
 * identity collapse into one — two of them would be the same asignatura twice.
 */
export function planCoursesToDrafts(courses: PlanCourse[]): DraftCourse[] {
  const seen = new Set<string>()

  return [...courses]
    .sort((a, b) => a.order - b.order)
    .reduce<DraftCourse[]>((rows, course) => {
      const key = courseRowKey(course)

      if (seen.has(key)) return rows

      seen.add(key)
      rows.push({
        key,
        origin: 'manual',
        academic_group_id: course.academic_group_id,
        course_name: course.course_name,
        course_code: course.course_code,
        group_name: course.group_name,
        program_name: course.program_name,
        order: rows.length,
      })

      return rows
    }, [])
}
