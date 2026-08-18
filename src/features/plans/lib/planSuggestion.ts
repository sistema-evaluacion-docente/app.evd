import type { PlanCandidate } from '../types'

/**
 * When the system suggests drawing up an improvement plan for a teacher:
 * the overall average or any single indicator under the institutional
 * threshold (`GET /improvement-plans/indicators`), or a student comment
 * classified as high risk.
 *
 * It is a suggestion, never a verdict: the plan is a formal agreement that
 * comes out of an acta, so the director is the one who decides. The rule lives
 * here so the badge, the list and whatever else reads it stay in agreement.
 *
 * @example
 * if (isPlanSuggested(candidate)) // paint the hint next to the name
 */
export function isPlanSuggested(candidate: PlanCandidate): boolean {
  return (
    candidate.below_threshold ||
    candidate.weak_dimensions.length > 0 ||
    candidate.weak_questions.length > 0 ||
    (candidate.high_risk_comment_count ?? 0) > 0
  )
}

/**
 * Why the plan is being suggested, as one readable sentence. Empty when
 * nothing triggered it.
 *
 * @example
 * planSuggestionReason(candidate) // 'promedio general bajo el umbral · 2 indicadores bajo el umbral'
 */
export function planSuggestionReason(candidate: PlanCandidate): string {
  const reasons: string[] = []

  if (candidate.below_threshold) reasons.push('promedio general bajo el umbral')

  const weak = candidate.weak_dimensions.length + candidate.weak_questions.length

  if (weak > 0) {
    reasons.push(`${weak} ${weak === 1 ? 'indicador' : 'indicadores'} bajo el umbral`)
  }

  const risky = candidate.high_risk_comment_count ?? 0

  if (risky > 0) {
    reasons.push(`${risky} ${risky === 1 ? 'comentario' : 'comentarios'} de alto riesgo`)
  }

  return reasons.join(' · ')
}
