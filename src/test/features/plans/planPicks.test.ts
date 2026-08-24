import { describe, expect, it } from 'vitest'

import { formatPicks, parsePicks, seedFromPicks } from '@/features/plans/lib/planPicks'
import type { IndicatorDimension, PlanIndicators, PlanSubjectOption } from '@/features/plans/types'
import type { TeacherComment } from '@/features/teachers/types'

const CATALOGUE = {
  threshold: 3.5,
  aspects: [
    { aspect: 1, label: 'Planeación', dimension: 'Metodología' },
    { aspect: 2, label: 'Desarrollo', dimension: 'Desempeño Docente' },
    { aspect: 5, label: 'Observaciones de los Estudiantes', dimension: null },
  ],
  overall: { target_type: 'OVERALL_AVERAGE', target_ref: null, label: 'General', suggestions: [] },
  dimensions: [],
} as unknown as PlanIndicators

const SUBJECTS: PlanSubjectOption[] = [
  {
    key: '1155201::A',
    label: 'Álgebra · Grupo A',
    course_name: 'Álgebra',
    course_code: '1155201',
    group_name: 'A',
    academic_group_id: 11,
    program_name: 'INGENIERIA DE SISTEMAS',
  },
  {
    key: '1155202::B',
    label: 'Cálculo · Grupo B',
    course_name: 'Cálculo',
    course_code: '1155202',
    group_name: 'B',
    academic_group_id: 12,
    program_name: 'INGENIERIA DE SISTEMAS',
  },
]

/** One dimension with one question, scored differently per asignatura. */
function matrix(average: number): IndicatorDimension[] {
  return [
    {
      dimension: 'Metodología',
      target_type: 'DIMENSION',
      target_ref: 'Metodología',
      average,
      below_threshold: average <= 3.5,
      suggestions: ['Rediseñar las guías'],
      questions: [
        {
          target_type: 'QUESTION',
          target_ref: '011',
          code: '011',
          text: 'Prepara la clase',
          average,
          below_threshold: average <= 3.5,
          suggestions: ['Publicar el plan de clase'],
        },
      ],
    },
  ]
}

/** Álgebra is the weak one; Cálculo and the teacher-wide read clear the bar. */
const SCORES: Record<string, number> = { '1155201::A': 2.8, '1155202::B': 4.1, '': 3.4 }

const COMMENTS = [
  { id: 77, original_text: 'Explica muy rápido', risk_level: { name: 'ALTO' } },
] as unknown as TeacherComment[]

const CONTEXT = {
  catalogue: CATALOGUE,
  subjects: SUBJECTS,
  matrixOf: (subjectKey: string | null) => matrix(SCORES[subjectKey ?? ''] ?? 0),
  comments: COMMENTS,
}

describe('formatPicks / parsePicks', () => {
  it('round-trips a selection, scope and all', () => {
    const picks = [
      { kind: 'question' as const, ref: '011', subjectKey: null },
      { kind: 'dimension' as const, ref: '2', subjectKey: '1155201::A' },
      { kind: 'comment' as const, ref: '77', subjectKey: '1155202::B' },
    ]

    const raw = formatPicks(picks)

    expect(raw).toBe('q:011,d:2@1155201::A,c:77@1155202::B')
    expect(parsePicks(raw)).toEqual(picks)
  })

  it('answers with nothing when the parameter is absent or empty', () => {
    expect(parsePicks(null)).toEqual([])
    expect(parsePicks('')).toEqual([])
    expect(formatPicks([])).toBe('')
  })

  // The value comes from a URL anyone can edit; a mistyped character should
  // cost one pick, not the whole form.
  it('drops what it cannot read instead of failing', () => {
    expect(parsePicks('q:011,,zzz,x:9,q:,:5,q:012')).toEqual([
      { kind: 'question', ref: '011', subjectKey: null },
      { kind: 'question', ref: '012', subjectKey: null },
    ])
  })

  it('keeps the same indicator once per asignatura, however often it repeats', () => {
    expect(parsePicks('q:011,q:011,q:011@1155201::A')).toEqual([
      { kind: 'question', ref: '011', subjectKey: null },
      { kind: 'question', ref: '011', subjectKey: '1155201::A' },
    ])
  })
})

describe('seedFromPicks', () => {
  it('reads the score of the asignatura the indicator was picked under', () => {
    const { items, courses } = seedFromPicks(parsePicks('q:011@1155201::A'), CONTEXT)

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      target_type: 'QUESTION',
      target_ref: '011',
      aspect: 1,
      baseline_value: 2.8,
      // Left empty on purpose: the form asks the director for it.
      target_value: null,
      commitment: '',
      source_subject_key: '1155201::A',
    })
    expect(items[0].description).toBe('011 · Prepara la clase — Álgebra · Grupo A (2.80)')
    expect(items[0].suggestions).toEqual(['Publicar el plan de clase'])

    // Only the asignatura it was read on, not every one the teacher taught.
    expect(courses).toEqual([expect.objectContaining({ course_code: '1155201' })])
  })

  it('picked at teacher level, the commitment covers every asignatura', () => {
    const { items, courses } = seedFromPicks(parsePicks('d:1'), CONTEXT)

    expect(items[0]).toMatchObject({
      target_type: 'DIMENSION',
      target_ref: 'Metodología',
      aspect: 1,
      baseline_value: 3.4,
      source_subject_key: null,
    })
    expect(courses.map((course) => course.course_code)).toEqual(['1155201', '1155202'])
  })

  /**
   * The same question low in two courses is two agreements, each with its own
   * evidences — which is what `PlanEvidence.item_id` and the printed Formato 2
   * both assume.
   */
  it('makes one commitment per indicator and asignatura', () => {
    const { items, courses } = seedFromPicks(
      parsePicks('q:011@1155201::A,q:011@1155202::B'),
      CONTEXT,
    )

    expect(items).toHaveLength(2)
    expect(items.map((item) => item.baseline_value)).toEqual([2.8, 4.1])
    expect(items[0].selection_id).not.toBe(items[1].selection_id)
    // Listed once each, not once per pick.
    expect(courses).toHaveLength(2)
  })

  it('cites a comment on aspect 5, where the official form prints them', () => {
    const { items } = seedFromPicks(parsePicks('c:77@1155201::A'), CONTEXT)

    expect(items[0]).toMatchObject({
      aspect: 5,
      target_type: 'QUALITATIVE',
      comment_ids: [77],
    })
  })

  it('drops a pick naming an asignatura the teacher never taught', () => {
    expect(seedFromPicks(parsePicks('q:011@9999::Z'), CONTEXT).items).toEqual([])
  })

  it('drops an indicator that is not in the matrix, and a comment that is gone', () => {
    expect(seedFromPicks(parsePicks('q:999,d:4,c:1234'), CONTEXT).items).toEqual([])
  })
})
