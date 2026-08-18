import { describe, expect, it } from 'vitest'

import { isPlanSuggested, planSuggestionReason } from '@/features/plans/lib/planSuggestion'
import type { IndicatorDimension, PlanCandidate, WeakQuestion } from '@/features/plans/types'

const HEALTHY: PlanCandidate = {
  teacher_id: 7,
  name: 'Ada Lovelace',
  avatar_url: null,
  institutional_code: '1150123',
  overall_average: 4.4,
  below_threshold: false,
  has_plan: false,
  dimensions: [],
  weak_dimensions: [],
  weak_questions: [],
  overall_suggestions: [],
}

const WEAK_DIMENSION = { dimension: 'Planeación del curso' } as IndicatorDimension
const WEAK_QUESTION = { code: '011' } as WeakQuestion

describe('isPlanSuggested', () => {
  it('says no when nothing is under the threshold and no comment is risky', () => {
    expect(isPlanSuggested(HEALTHY)).toBe(false)
  })

  it('says yes on an overall average under the threshold', () => {
    expect(isPlanSuggested({ ...HEALTHY, overall_average: 3.1, below_threshold: true })).toBe(true)
  })

  it('says yes on a single weak indicator even with a healthy average', () => {
    expect(isPlanSuggested({ ...HEALTHY, weak_questions: [WEAK_QUESTION] })).toBe(true)
    expect(isPlanSuggested({ ...HEALTHY, weak_dimensions: [WEAK_DIMENSION] })).toBe(true)
  })

  it('says yes on a high-risk comment alone', () => {
    expect(isPlanSuggested({ ...HEALTHY, high_risk_comment_count: 1 })).toBe(true)
  })

  it('holds back until the API ships the comment count', () => {
    expect(isPlanSuggested({ ...HEALTHY, high_risk_comment_count: 0 })).toBe(false)
  })
})

describe('planSuggestionReason', () => {
  it('spells out every reason that fired', () => {
    const reason = planSuggestionReason({
      ...HEALTHY,
      below_threshold: true,
      weak_dimensions: [WEAK_DIMENSION],
      weak_questions: [WEAK_QUESTION],
      high_risk_comment_count: 2,
    })

    expect(reason).toBe(
      'promedio general bajo el umbral · 2 indicadores bajo el umbral · 2 comentarios de alto riesgo',
    )
  })

  it('keeps the count in singular when only one thing fired', () => {
    expect(planSuggestionReason({ ...HEALTHY, weak_questions: [WEAK_QUESTION] })).toBe(
      '1 indicador bajo el umbral',
    )
  })

  it('is empty when the plan is not suggested', () => {
    expect(planSuggestionReason(HEALTHY)).toBe('')
  })
})
