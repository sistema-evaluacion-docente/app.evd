import type { DraftCourse, DraftItem, PlanAspect } from '../types'

/**
 * What the plan form still needs before it can be saved.
 *
 * The form is one long page, so the errors are listed in the order the page
 * paints them: the first one is the field to scroll to and put the cursor in.
 * Nothing here decides *when* an error is shown — that is the touched/submitted
 * bookkeeping in the page — only what is missing.
 */

/** A field that is still empty, addressed by the `id` of its own control. */
export interface PlanFieldError {
  /** DOM id of the control, so the page can focus it without a ref registry. */
  id: string
  message: string
}

/** Ids of the fields a commitment card owns, given its draft key. */
export const commitmentFieldId = {
  description: (key: string) => `desc-${key}`,
  commitment: (key: string) => `commit-${key}`,
  target: (key: string) => `target-${key}`,
  aspect: (key: string) => `aspect-${key}`,
}

/**
 * Anchors of the two section-level errors. They sit on the empty-state message
 * of their own section rather than on the button that fixes them: the message
 * is what turns red, so it is also what the scroll has to land on.
 */
export const COMMITMENTS_ANCHOR_ID = 'commitments-empty'
export const COURSES_ANCHOR_ID = 'courses-empty'

/** Only these two carry a score, so only they are given a meta esperada. */
export function isMeasurable(item: DraftItem): boolean {
  return item.target_type === 'DIMENSION' || item.target_type === 'QUESTION'
}

function isBlank(value: string): boolean {
  return value.trim().length === 0
}

/**
 * The commitments in the order the editor lays them out: grouped by the aspect
 * of the official format, and the ones without an aspect last. Focusing the
 * "first" error only means anything if this matches what the director sees —
 * and so does numbering the cards, which reads the same order from here.
 */
export function itemsInPaintedOrder(items: DraftItem[], aspects: PlanAspect[]): DraftItem[] {
  const grouped = aspects.flatMap((aspect) => items.filter((item) => item.aspect === aspect.aspect))

  return [...grouped, ...items.filter((item) => item.aspect == null)]
}

/**
 * Everything missing from the form, in painting order.
 *
 * @example
 * const errors = planFormErrors({ isEdit: false, actaLocked: false, teacherId: undefined, ... })
 * errors[0] // → { id: 'teacher', message: 'Selecciona un docente.' }
 */
export function planFormErrors({
  isEdit,
  actaLocked,
  teacherId,
  periodId,
  title,
  items,
  aspects,
  courses,
  facultyName,
  departmentName,
  programName,
  actaNumber,
  actaDate,
}: {
  isEdit: boolean
  /** A signed acta rejects its own content, so none of it is asked for again. */
  actaLocked: boolean
  teacherId?: number
  periodId?: number
  title: string
  items: DraftItem[]
  aspects: PlanAspect[]
  courses: DraftCourse[]
  /** The resolved values, not the overrides: they are what gets printed. */
  facultyName: string
  departmentName: string
  programName: string
  actaNumber: string
  actaDate: string
}): PlanFieldError[] {
  const errors: PlanFieldError[] = []

  // Section 1. Neither travels in an update: they are what the plan *is*.
  if (!isEdit) {
    if (periodId == null) errors.push({ id: 'period', message: 'Selecciona un periodo.' })
    if (teacherId == null) errors.push({ id: 'teacher', message: 'Selecciona un docente.' })
  }

  // Section 3.
  if (!actaLocked) {
    if (items.length === 0) {
      errors.push({
        id: COMMITMENTS_ANCHOR_ID,
        message: 'Agrega al menos un indicador, un comentario o un compromiso manual.',
      })
    }

    for (const item of itemsInPaintedOrder(items, aspects)) {
      if (item.aspect == null) {
        errors.push({
          id: commitmentFieldId.aspect(item.key),
          message: 'Elige el aspecto del formato.',
        })
      }

      if (isBlank(item.description)) {
        errors.push({
          id: commitmentFieldId.description(item.key),
          message: 'Falta la descripción del indicador comprometido.',
        })
      }

      if (isBlank(item.commitment)) {
        errors.push({
          id: commitmentFieldId.commitment(item.key),
          message: 'Falta el compromiso.',
        })
      }

      if (isMeasurable(item) && item.target_value == null) {
        errors.push({
          id: commitmentFieldId.target(item.key),
          message: 'Falta la meta esperada.',
        })
      }
    }
  }

  // Section 4. The asignaturas are the table Formatos 2 and 3 print under the
  // commitments; a plan that lists none is a form with an empty block on it.
  if (!actaLocked && teacherId != null && courses.length === 0) {
    errors.push({
      id: COURSES_ANCHOR_ID,
      message: 'Vincula al menos una asignatura al plan.',
    })
  }

  // Section 5, in the order the section paints it.
  if (isBlank(title)) errors.push({ id: 'title', message: 'El plan necesita un título.' })

  // The three columns of the header of the official forms.
  if (isBlank(facultyName)) errors.push({ id: 'faculty', message: 'Indica la facultad.' })

  if (isBlank(departmentName)) {
    errors.push({ id: 'department', message: 'Indica el departamento académico.' })
  }

  if (isBlank(programName)) errors.push({ id: 'program', message: 'Indica el programa académico.' })

  // Part of the acta, so a signed one doesn't get asked for them again — and
  // couldn't answer anyway, with both fields disabled.
  if (!actaLocked) {
    if (isBlank(actaNumber)) {
      errors.push({ id: 'acta-number', message: 'Falta el número del acta.' })
    }

    if (isBlank(actaDate)) errors.push({ id: 'acta-date', message: 'Falta la fecha del acta.' })
  }

  return errors
}

/** Ids of the fields one seguimiento owns, matching what `PlanCheckpoints` renders. */
export const checkpointFieldId = {
  date: (checkpointId: number) => `date-${checkpointId}`,
  note: (checkpointId: number, aspect: number) => `note-${checkpointId}-${aspect}`,
}

/**
 * What a seguimiento still needs before it can be saved, in painting order.
 *
 * A cut is only worth recording once it says *when* it was made and *what* was
 * observed: the API takes every field as optional, so an empty save used to go
 * through, answer "guardado" and overwrite the previous notes with `''`.
 *
 * Every aspect on screen is asked for, not just one — the aspects passed in are
 * already the ones the plan committed to, so each of them is a row Formato 3
 * prints and would otherwise print blank.
 *
 * @example
 * checkpointErrors({ checkpointId: 7, date: '', aspects, notes: {} })[0]
 * // → { id: 'date-7', message: 'Registra la fecha del seguimiento.' }
 */
export function checkpointErrors({
  checkpointId,
  date,
  aspects,
  notes,
}: {
  checkpointId: number
  date: string
  aspects: PlanAspect[]
  notes: Record<number, string>
}): PlanFieldError[] {
  const errors: PlanFieldError[] = []

  if (isBlank(date)) {
    errors.push({
      id: checkpointFieldId.date(checkpointId),
      message: 'Registra la fecha del seguimiento.',
    })
  }

  for (const aspect of aspects) {
    if (isBlank(notes[aspect.aspect] ?? '')) {
      errors.push({
        id: checkpointFieldId.note(checkpointId, aspect.aspect),
        message: 'Falta la observación de este aspecto.',
      })
    }
  }

  return errors
}

/**
 * Scrolls to a field and puts the cursor in it.
 *
 * Deferred a frame: after a failed submit the page is re-rendering the fields
 * in red, and scrolling to one that is about to move lands in the wrong place.
 *
 * @example
 * focusField('commit-draft-3')
 */
export function focusField(id: string): void {
  requestAnimationFrame(() => {
    const element = document.getElementById(id)

    if (!element) return

    element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    // `preventScroll` so focusing doesn't fight the smooth scroll above with a
    // second, instant jump.
    element.focus({ preventScroll: true })
  })
}
