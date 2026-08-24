import type { TeacherComment } from '@/features/teachers/types'
import type {
  DraftItem,
  IndicatorDimension,
  PlanCourseInput,
  PlanIndicators,
  PlanSubjectOption,
} from '../types'
import { buildCommentDraft, buildIndicatorDraft, coursesOfSubject } from './planDraft'
import { courseKey } from './indicatorMatrix'

/**
 * The selection a director gathered on a teacher's profile, on its way to the
 * plan form.
 *
 * It travels in the URL rather than in `localStorage` because the form is where
 * the catalogue, the threshold and the asignaturas already live: resolving a
 * pick into a commitment belongs there, and the profile stays thin enough not
 * to fetch the indicator catalogue just to hand something over. It also
 * survives a reload and the back button, which a one-shot storage key does not.
 *
 * @example
 * formatPicks([{ kind: 'question', ref: '011', subjectKey: '1155201::A' }])
 * // → 'q:011@1155201::A'
 */

/** Separator between picks. Neither a question code nor a course code holds it. */
const SEPARATOR = ','

/** Separates a pick from the asignatura it was read on. */
const SCOPE = '@'

export interface PlanPick {
  kind: 'dimension' | 'question' | 'comment'
  /**
   * What identifies it inside its kind: the aspect number for a dimension
   * (1-4, as the official form numbers them), the question code, or the
   * comment id. A dimension travels by aspect and not by name so an accented
   * "Integración Interpersonal" doesn't end up encoded in a query string.
   */
  ref: string
  /** `courseKey` of the asignatura, or `null` at teacher level. */
  subjectKey: string | null
}

const PREFIX: Record<PlanPick['kind'], string> = {
  dimension: 'd',
  question: 'q',
  comment: 'c',
}

const KIND_OF: Record<string, PlanPick['kind']> = {
  d: 'dimension',
  q: 'question',
  c: 'comment',
}

/** The `picks` parameter for a selection. Empty when nothing was picked. */
export function formatPicks(picks: PlanPick[]): string {
  return picks
    .map((pick) => {
      const scope = pick.subjectKey == null ? '' : `${SCOPE}${pick.subjectKey}`

      return `${PREFIX[pick.kind]}:${pick.ref}${scope}`
    })
    .join(SEPARATOR)
}

/**
 * Reads the `picks` parameter back.
 *
 * Anything it cannot make sense of is dropped rather than thrown over: the
 * value comes from a URL, which anyone can edit, and a mistyped character
 * should cost one pick and not the whole form.
 *
 * @example
 * parsePicks('q:011,d:2@1155201::A')
 * // → [{ kind: 'question', ref: '011', subjectKey: null },
 * //    { kind: 'dimension', ref: '2', subjectKey: '1155201::A' }]
 */
export function parsePicks(raw: string | null | undefined): PlanPick[] {
  if (!raw) return []

  const seen = new Set<string>()
  const picks: PlanPick[] = []

  for (const token of raw.split(SEPARATOR)) {
    const entry = token.trim()

    if (entry.length === 0) continue

    const colon = entry.indexOf(':')

    if (colon < 1) continue

    const kind = KIND_OF[entry.slice(0, colon)]

    if (!kind) continue

    const rest = entry.slice(colon + 1)
    const at = rest.indexOf(SCOPE)

    const ref = at === -1 ? rest : rest.slice(0, at)
    const subjectKey = at === -1 ? null : rest.slice(at + SCOPE.length)

    if (ref.length === 0) continue

    // The same indicator on the same asignatura is one pick, however many times
    // the parameter repeats it.
    const identity = `${kind}:${ref}${SCOPE}${subjectKey ?? ''}`

    if (seen.has(identity)) continue

    seen.add(identity)
    picks.push({ kind, ref, subjectKey: subjectKey === '' ? null : subjectKey })
  }

  return picks
}

/** What `seedFromPicks` needs to turn a pick back into a commitment. */
export interface PickSeedContext {
  catalogue: PlanIndicators
  /** Every asignatura the teacher taught in the period. */
  subjects: PlanSubjectOption[]
  /** The scored matrix of one asignatura, or of the teacher when `null`. */
  matrixOf: (subjectKey: string | null) => IndicatorDimension[]
  /** Every student comment of the period, for the ones cited by id. */
  comments: TeacherComment[]
}

export interface SeededPicks {
  items: DraftItem[]
  /** The asignaturas the picks bring into the plan, in the order they appear. */
  courses: PlanCourseInput[]
}

/**
 * Turns a parsed selection into the commitments and asignaturas the form starts
 * from.
 *
 * One commitment per indicator *and* asignatura: the same question low in two
 * courses is two agreements, each with its own evidences, which is the model
 * `PlanEvidence.item_id` and the printed Formato 2 both assume. A pick whose
 * indicator is not in the catalogue, or whose asignatura the teacher did not
 * teach, is dropped — it can only come from a hand-edited URL.
 *
 * @example
 * const { items, courses } = seedFromPicks(parsePicks(search), context)
 */
export function seedFromPicks(picks: PlanPick[], context: PickSeedContext): SeededPicks {
  const { catalogue, subjects, matrixOf, comments } = context

  const items: DraftItem[] = []
  const courses: PlanCourseInput[] = []
  const listed = new Set<string>()

  /** Matrices are memoised per asignatura: a pick each would rebuild them. */
  const matrices = new Map<string, IndicatorDimension[]>()

  function matrix(subjectKey: string | null): IndicatorDimension[] {
    const cacheKey = subjectKey ?? ''

    if (!matrices.has(cacheKey)) matrices.set(cacheKey, matrixOf(subjectKey))

    return matrices.get(cacheKey) ?? []
  }

  function addCourses(incoming: PlanCourseInput[]) {
    for (const course of incoming) {
      const key = courseKey(course)

      if (listed.has(key)) continue

      listed.add(key)
      courses.push(course)
    }
  }

  for (const pick of picks) {
    const subject =
      pick.subjectKey == null
        ? null
        : (subjects.find((option) => option.key === pick.subjectKey) ?? null)

    // A scope that names an asignatura the teacher never taught is not a
    // teacher-level pick; it is a broken URL, and guessing would file a
    // commitment against the wrong scores.
    if (pick.subjectKey != null && !subject) continue

    if (pick.kind === 'comment') {
      const id = Number(pick.ref)
      const comment = Number.isFinite(id) ? comments.find((entry) => entry.id === id) : undefined

      if (!comment) continue

      items.push(buildCommentDraft(comment, subject))
      addCourses(coursesOfSubject(subject, []))
      continue
    }

    const scored = matrix(pick.subjectKey)

    if (pick.kind === 'dimension') {
      const aspect = Number(pick.ref)
      const name = catalogue.aspects.find((entry) => entry.aspect === aspect)?.dimension

      if (!name) continue

      const dimension = scored.find((entry) => entry.dimension === name)

      if (!dimension) continue

      items.push(
        buildIndicatorDraft(
          {
            target_type: 'DIMENSION',
            target_ref: dimension.target_ref,
            label: dimension.dimension,
            average: dimension.average,
            aspect,
            suggestions: dimension.suggestions,
          },
          subject,
        ),
      )
    } else {
      const found = scored
        .flatMap((dimension) =>
          dimension.questions.map((question) => ({ question, dimension: dimension.dimension })),
        )
        .find((entry) => entry.question.code === pick.ref)

      if (!found) continue

      const aspect =
        catalogue.aspects.find((entry) => entry.dimension === found.dimension)?.aspect ?? null

      items.push(
        buildIndicatorDraft(
          {
            target_type: 'QUESTION',
            target_ref: found.question.target_ref,
            label: `${found.question.code} · ${found.question.text}`,
            average: found.question.average,
            aspect,
            suggestions: found.question.suggestions,
          },
          subject,
        ),
      )
    }

    // Picked at teacher level, the commitment covers every asignatura he
    // taught — the same rule the form's own picker follows.
    addCourses(coursesOfSubject(subject, subjects))
  }

  return { items, courses }
}
