import { describe, expect, it } from 'vitest'

import { planCoursesToDrafts, planItemsToDrafts } from '@/features/plans/lib/planDraft'
import type { PlanCourse, PlanIndicators, PlanItem } from '@/features/plans/types'

function item(overrides: Partial<PlanItem> = {}): PlanItem {
  return {
    id: 41,
    plan_id: 8,
    description: 'Metodología — Álgebra (2.80)',
    commitment: 'Rediseñar las guías de clase',
    aspect: 1,
    target_type: 'DIMENSION',
    target_ref: 'Metodología',
    baseline_value: 2.8,
    target_value: 3.5,
    result_value: null,
    status: 'PENDIENTE',
    order: 0,
    comments: [],
    ...overrides,
  }
}

function course(overrides: Partial<PlanCourse> = {}): PlanCourse {
  return {
    id: 1,
    plan_id: 8,
    academic_group_id: 55,
    course_name: 'Álgebra Lineal',
    course_code: '1155101',
    group_name: 'A',
    program_name: 'Ingeniería de Sistemas',
    order: 0,
    ...overrides,
  }
}

const CATALOGUE = {
  threshold: 3.5,
  aspects: [],
  overall: { target_type: 'OVERALL_AVERAGE', target_ref: null, label: 'General', suggestions: [] },
  dimensions: [
    {
      dimension: 'Metodología',
      target_type: 'DIMENSION',
      target_ref: 'Metodología',
      label: 'Metodología',
      suggestions: ['Rediseñar las guías'],
      questions: [
        {
          target_type: 'QUESTION',
          target_ref: '011',
          code: '011',
          text: 'Prepara la clase',
          suggestions: ['Publicar el plan de clase'],
        },
      ],
    },
  ],
} as unknown as PlanIndicators

describe('planItemsToDrafts', () => {
  it('conserva el id: sin él la API recrea el compromiso y pierde sus evidencias', () => {
    const [draft] = planItemsToDrafts([item()])

    expect(draft.id).toBe(41)
  })

  it('conserva el estado ya verificado, para no borrar el avance al reguardar', () => {
    const [draft] = planItemsToDrafts([item({ status: 'CUMPLIDO' })])

    expect(draft.status).toBe('CUMPLIDO')
  })

  it('respeta el orden guardado aunque llegue desordenado', () => {
    const drafts = planItemsToDrafts([
      item({ id: 2, order: 1, description: 'segundo' }),
      item({ id: 1, order: 0, description: 'primero' }),
    ])

    expect(drafts.map((draft) => draft.description)).toEqual(['primero', 'segundo'])
  })

  it('un compromiso sin compromiso escrito llega como cadena vacía, no como null', () => {
    const [draft] = planItemsToDrafts([item({ commitment: null })])

    expect(draft.commitment).toBe('')
  })

  it('recupera las sugerencias del catálogo, que el plan no guarda', () => {
    const [dimension] = planItemsToDrafts([item()], CATALOGUE)
    const [question] = planItemsToDrafts(
      [item({ target_type: 'QUESTION', target_ref: '011' })],
      CATALOGUE,
    )

    expect(dimension.suggestions).toEqual(['Rediseñar las guías'])
    expect(question.suggestions).toEqual(['Publicar el plan de clase'])
  })

  it('devuelve los comentarios citados para que se sigan viendo al editar', () => {
    const [draft] = planItemsToDrafts([
      item({
        target_type: 'QUALITATIVE',
        target_ref: null,
        comments: [
          {
            comment_id: 91,
            original_text: 'no explica bien',
            risk_level_name: 'Alto',
            risk_score: 0.8,
          },
        ],
      }),
    ])

    expect(draft.comment_ids).toEqual([91])
    expect(draft.comment_previews).toEqual([
      { id: 91, text: 'no explica bien', risk_level_name: 'Alto' },
    ])
  })

  it('da a cada borrador una key propia aunque compartan indicador', () => {
    const drafts = planItemsToDrafts([item({ id: 1 }), item({ id: 2 })])

    expect(new Set(drafts.map((draft) => draft.key)).size).toBe(2)
  })
})

describe('planCoursesToDrafts', () => {
  it('las marca manuales: ya son parte del acuerdo, despicar no debe quitarlas', () => {
    const [draft] = planCoursesToDrafts([course()])

    expect(draft.origin).toBe('manual')
    expect(draft.course_name).toBe('Álgebra Lineal')
  })

  it('colapsa filas repetidas: la misma asignatura dos veces es una', () => {
    const drafts = planCoursesToDrafts([course({ id: 1 }), course({ id: 2 })])

    expect(drafts).toHaveLength(1)
  })

  it('renumera el orden de forma contigua', () => {
    const drafts = planCoursesToDrafts([
      course({ id: 1, academic_group_id: 55, order: 3 }),
      course({ id: 2, academic_group_id: 56, order: 7 }),
    ])

    expect(drafts.map((draft) => draft.order)).toEqual([0, 1])
  })
})
