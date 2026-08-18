import { describe, expect, it } from 'vitest'

import {
  buildDimensionsFromDetail,
  countWeak,
  courseKey,
  courseLabel,
  hasWeakIndicators,
} from '@/features/plans/lib/indicatorMatrix'
import type { PlanIndicators } from '@/features/plans'

const CATALOGUE = {
  threshold: 3.5,
  aspects: [],
  overall: { target_type: 'OVERALL_AVERAGE', target_ref: null, label: '', suggestions: [] },
  dimensions: [
    {
      dimension: 'Desempeño Docente',
      target_type: 'DIMENSION',
      target_ref: 'Desempeño Docente',
      label: 'Desempeño Docente',
      suggestions: ['Planear las clases con antelación'],
      questions: [
        {
          target_type: 'QUESTION',
          target_ref: '011',
          code: '011',
          text: 'Asiste puntualmente a clase.',
          suggestions: ['Llegar a tiempo'],
        },
        {
          target_type: 'QUESTION',
          target_ref: '012',
          code: '012',
          text: 'Realiza actividades de asesoría.',
          suggestions: [],
        },
      ],
    },
  ],
} as PlanIndicators

describe('courseKey / courseLabel', () => {
  it('identifies a subject by course and group', () => {
    expect(courseKey({ course_code: 'CAL', group_name: 'A' })).toBe('CAL::A')
  })

  it('labels a subject with its group', () => {
    expect(courseLabel({ course_name: 'Cálculo I', group_name: 'A' })).toBe('Cálculo I · Grupo A')
  })
})

describe('buildDimensionsFromDetail', () => {
  it('flags what is below the threshold and keeps the catalogue suggestions', () => {
    const [dimension] = buildDimensionsFromDetail(
      [
        {
          dimension: 'Desempeño Docente',
          average: 3.1,
          questions: [
            { code: '011', text: 'Asiste puntualmente a clase.', score: 2.9 },
            { code: '012', text: 'Realiza actividades de asesoría.', score: 4.2 },
          ],
        },
      ],
      CATALOGUE,
      3.5,
    )

    expect(dimension.below_threshold).toBe(true)
    expect(dimension.suggestions).toEqual(['Planear las clases con antelación'])
    expect(dimension.questions[0].below_threshold).toBe(true)
    expect(dimension.questions[1].below_threshold).toBe(false)
    expect(countWeak([dimension])).toBe(2)
  })

  it('renders the dimension even when the subject has no scores for it', () => {
    const [dimension] = buildDimensionsFromDetail([], CATALOGUE, 3.5)

    expect(dimension.average).toBeNull()
    expect(dimension.below_threshold).toBe(false)
    expect(hasWeakIndicators([dimension])).toBe(false)
  })

  it('averages the questions when the dimension has no average of its own', () => {
    const [dimension] = buildDimensionsFromDetail(
      [
        {
          dimension: 'Desempeño Docente',
          average: undefined as unknown as number,
          questions: [
            { code: '011', text: 'Asiste puntualmente a clase.', score: 3 },
            { code: '012', text: 'Realiza actividades de asesoría.', score: 4 },
          ],
        },
      ],
      CATALOGUE,
      3.5,
    )

    expect(dimension.average).toBe(3.5)
  })
})
