import { questions } from '@/lib/questions'
import type {
  PlanIndicators,
  PlanVerification,
  PlanVerificationComment,
  TargetType,
} from '../types'
import type { PlanPick } from './planPicks'

/**
 * Reading the verification of a plan — what the semester *after* the plan said
 * about it.
 *
 * Kept apart from `planStatus` on purpose: that module is about the result the
 * director signed at the closing, this one about what the grades said
 * afterwards.
 */

/** How an agreed indicator reads to a person. */
export function indicatorLabel(targetType: TargetType, targetRef: string | null): string {
  if (targetType === 'OVERALL_AVERAGE') return 'Promedio general'
  if (targetType === 'DIMENSION' && targetRef) return targetRef
  if (targetType === 'QUESTION' && targetRef) {
    return questions[targetRef]?.question ?? targetRef
  }

  return 'Indicador comprometido'
}

/**
 * Subjects where the indicator stayed under the target even though the
 * teacher's overall average cleared it.
 *
 * This is the case the per-course breakdown exists for: the commitment was
 * about the teacher, so the verdict is their overall average, but a single
 * course can still be dragging and nobody would see it.
 */
export function hiddenWeakCourses(verification: PlanVerification) {
  return verification.items
    .filter((item) => item.met === true)
    .flatMap((item) =>
      item.courses.filter((course) => !course.met).map((course) => ({ item, course })),
    )
}

/** Comments that raise the alert: the ALTO ones. */
export function alertComments(verification: PlanVerification): PlanVerificationComment[] {
  return verification.comment_findings.filter((finding) => finding.is_alert)
}

/**
 * The MEDIO ones, kept as context. They are not proof of anything on their
 * own, but dropping them would hide a trend the director should read.
 */
export function contextComments(verification: PlanVerification): PlanVerificationComment[] {
  return verification.comment_findings.filter((finding) => !finding.is_alert)
}

/** Whether there is anything at all to show. */
export function hasFindings(verification: PlanVerification): boolean {
  return verification.items.length > 0 || verification.comment_findings.length > 0
}

/**
 * What a plan for the *next* semester should start from, when this one came
 * back "No mejoró".
 *
 * The director should not have to remember which indicators the teacher fell
 * back on, so the reincidencia is handed to the creation form as its `picks`
 * parameter — the same one the selection panel of the teacher's profile fills.
 *
 * Everything comes out at teacher level: the commitment was agreed on the
 * teacher's average over all their groups, which is the figure the acta
 * settled and the one `met` was decided against. The per-course breakdown is
 * for reading, not for filing a second commitment.
 *
 * Only the targets that were actually missed travel. `met === true` improved,
 * `met === null` has no grades to compare against — neither is a relapse. The
 * alert comments do come along: they are the complaint coming back in the
 * students' own words, and a plan that ignores them repeats the last one.
 *
 * @example
 * formatPicks(followUpPicks(plan.verification, catalogue)) // → 'q:011,d:2,c:4821'
 */
export function followUpPicks(
  verification: PlanVerification,
  catalogue: PlanIndicators | undefined,
): PlanPick[] {
  const picks: PlanPick[] = []

  for (const item of verification.items) {
    if (item.met !== false || !item.target_ref) continue

    if (item.target_type === 'QUESTION') {
      picks.push({
        kind: 'question',
        ref: questionCode(item.target_ref, catalogue),
        subjectKey: null,
      })
      continue
    }

    if (item.target_type === 'DIMENSION') {
      const aspect = dimensionAspect(item.target_ref, catalogue)

      // A dimension travels by the aspect number the official form gives it,
      // and without the catalogue there is no way to know it. Dropping the
      // pick loses one preselection; guessing would file the commitment under
      // the wrong section of the acta.
      if (aspect != null) picks.push({ kind: 'dimension', ref: String(aspect), subjectKey: null })
    }

    // OVERALL_AVERAGE, QUALITATIVE and PEDAGOGICAL_CATEGORY have no `picks`
    // kind, and the form's matrix does not offer them either, so there is
    // nothing to preselect them onto.
  }

  for (const finding of alertComments(verification)) {
    picks.push({ kind: 'comment', ref: String(finding.comment_id), subjectKey: null })
  }

  return picks
}

/**
 * The question code a `target_ref` stands for. They are the same string today,
 * but the catalogue is what the picker matches on, so it gets the last word.
 */
function questionCode(targetRef: string, catalogue: PlanIndicators | undefined): string {
  for (const dimension of catalogue?.dimensions ?? []) {
    const question = dimension.questions.find((entry) => entry.target_ref === targetRef)

    if (question) return question.code
  }

  return targetRef
}

/** Which of the five sections of the form a dimension belongs to. */
function dimensionAspect(targetRef: string, catalogue: PlanIndicators | undefined): number | null {
  if (!catalogue) return null

  const name =
    catalogue.dimensions.find((entry) => entry.target_ref === targetRef)?.dimension ?? targetRef

  return catalogue.aspects.find((entry) => entry.dimension === name)?.aspect ?? null
}
