import { questions } from '@/lib/questions'
import type { PlanVerification, PlanVerificationComment, TargetType } from '../types'

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
