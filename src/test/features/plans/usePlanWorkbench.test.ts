import { describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { usePlanWorkbench } from '@/features/plans/hooks/usePlanWorkbench'
import { SUBJECT_ALL } from '@/features/plans/lib/indicatorMatrix'
import type { PlanCandidate, PlanIndicators } from '@/features/plans/types'
import type { TeacherComment } from '@/features/teachers/types'
import { waitFor } from '@testing-library/react'

import { renderApiHook } from '@/test/apiHarness'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

const mockApi = vi.mocked(api)

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
          suggestions: [],
        },
      ],
    },
  ],
} as PlanIndicators

const WEAK_DIMENSIONS = [
  { dimension: 'Desempeño Docente', average: 3.1, questions: [{ code: '011', text: 'x', score: 2.9 }] },
]
const STRONG_DIMENSIONS = [
  { dimension: 'Desempeño Docente', average: 4.5, questions: [{ code: '011', text: 'x', score: 4.5 }] },
]

const DETAIL = {
  teacher_id: 4,
  institutional_code: 'A1',
  name: 'Ada Lovelace',
  avatar_url: '',
  contract_type: 'TIEMPO COMPLETO',
  evaluation_id: 9,
  period_code: '2028-1',
  period_name: '2028-1',
  overall_average: 3.8,
  group_count: 2,
  courses: [
    {
      course_code: 'CAL',
      course_name: 'Cálculo I',
      group_name: 'A',
      respondent_count: 10,
      overall_average: 3.1,
      dimensions: WEAK_DIMENSIONS,
    },
    {
      course_code: 'FIS',
      course_name: 'Física I',
      group_name: 'B',
      respondent_count: 8,
      overall_average: 4.5,
      dimensions: STRONG_DIMENSIONS,
    },
  ],
  dimensions: WEAK_DIMENSIONS,
}

const COURSES_RESPONSE = [
  {
    academic_group_id: 100,
    course_code: 'CAL',
    course_name: 'Cálculo I',
    group_name: 'A',
    program_name: 'Ing. Sistemas',
  },
  {
    academic_group_id: 101,
    course_code: 'FIS',
    course_name: 'Física I',
    group_name: 'B',
    program_name: 'Ing. Sistemas',
  },
]

const riskyComment: TeacherComment = {
  id: 1,
  teacher_id: 4,
  evaluation_id: 9,
  academic_groups_id: 100,
  group_name: 'A',
  teacher_name: 'Ada Lovelace',
  teacher_avatar_url: '',
  course_name: 'Cálculo I',
  original_text: 'Falta mucho a clase',
  risk_level: { id: 3, name: 'ALTO', color_hex: '#ef4444' },
  risk_score: 0.9,
  pedagogical_categories: [
    { id: 1, name: 'LABEL_1', description: '', color_hex: '#7c3aed', score: 0.9 },
  ],
  created_at: '2028-02-01T00:00:00Z',
  updated_at: '2028-02-01T00:00:00Z',
}

const COMMENTS_RESPONSE = {
  teacher_id: 4,
  evaluation_id: 9,
  ai_status: 'ANALYZED',
  courses: [
    { course_code: 'CAL', course_name: 'Cálculo I', group_name: 'A', comments: [riskyComment] },
  ],
}

function mockEndpoints() {
  mockApi.get.mockImplementation((url: string) => {
    if (url === '/evaluations/teachers/4/detail') return Promise.resolve({ data: DETAIL })
    if (url === '/improvement-plans/teacher/4/courses')
      return Promise.resolve({ data: COURSES_RESPONSE })
    if (url === '/evaluations/9/teachers/4/comments')
      return Promise.resolve({ data: COMMENTS_RESPONSE })

    return Promise.resolve({ data: null })
  })
}

describe('usePlanWorkbench', () => {
  it('stays empty and not loading without a teacher/period selected', async () => {
    const { result } = renderApiHook(() =>
      usePlanWorkbench({
        threshold: 3.5,
        onlyWeak: false,
        subjectKey: SUBJECT_ALL,
        catalogue: CATALOGUE,
      }),
    )

    expect(result.current.isLoading).toBe(false)
    expect(result.current.allSubjects).toEqual([])
    // Still built from the catalogue alone — every question just comes back
    // unscored, since there is no teacher detail yet to read averages off.
    expect(result.current.dimensions[0].average).toBeNull()
  })

  it('builds every subject with its weak/risky counts', async () => {
    mockEndpoints()

    const { result } = renderApiHook(() =>
      usePlanWorkbench({
        teacherId: 4,
        periodId: 10,
        periodName: '2028-1',
        threshold: 3.5,
        onlyWeak: false,
        subjectKey: SUBJECT_ALL,
        catalogue: CATALOGUE,
      }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.allSubjects).toHaveLength(2)
    const cal = result.current.allSubjects.find((s) => s.course_code === 'CAL')!
    expect(cal.label).toBe('Cálculo I · Grupo A')
    expect(cal.academic_group_id).toBe(100)
    expect(cal.program_name).toBe('Ing. Sistemas')
    expect(cal.weakCount).toBe(2)
    expect(cal.riskyCount).toBe(1)

    const fis = result.current.allSubjects.find((s) => s.course_code === 'FIS')!
    expect(fis.weakCount).toBe(0)
    expect(fis.riskyCount).toBe(0)

    expect(result.current.subjectsWithFindings).toEqual([cal])
    expect(result.current.hasCommentData).toBe(true)
    expect(result.current.aiStatus).toBe('ANALYZED')
    expect(result.current.allComments).toEqual([riskyComment])
  })

  it('narrows subjectOptions to the ones with findings when onlyWeak is set', async () => {
    mockEndpoints()

    const { result } = renderApiHook(() =>
      usePlanWorkbench({
        teacherId: 4,
        periodId: 10,
        periodName: '2028-1',
        threshold: 3.5,
        onlyWeak: true,
        subjectKey: SUBJECT_ALL,
        catalogue: CATALOGUE,
      }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.subjectOptions.map((s) => s.course_code)).toEqual(['CAL'])
  })

  it('falls back to SUBJECT_ALL when the chosen subject is filtered out', async () => {
    mockEndpoints()

    const { result } = renderApiHook(() =>
      usePlanWorkbench({
        teacherId: 4,
        periodId: 10,
        periodName: '2028-1',
        threshold: 3.5,
        onlyWeak: true,
        subjectKey: 'FIS::B',
        catalogue: CATALOGUE,
      }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.effectiveSubjectKey).toBe(SUBJECT_ALL)
    expect(result.current.activeSubject).toBeNull()
  })

  it('scopes the matrix, comments and counts to the selected subject', async () => {
    mockEndpoints()

    const { result } = renderApiHook(() =>
      usePlanWorkbench({
        teacherId: 4,
        periodId: 10,
        periodName: '2028-1',
        threshold: 3.5,
        onlyWeak: false,
        subjectKey: 'CAL::A',
        catalogue: CATALOGUE,
      }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.effectiveSubjectKey).toBe('CAL::A')
    expect(result.current.dimensions[0].below_threshold).toBe(true)
    expect(result.current.weakCount).toBe(2)
    expect(result.current.riskyCount).toBe(1)
    expect(result.current.comments.byDimension['Desempeño Docente']).toHaveLength(1)
  })

  it('reads the teacher-wide matrix off the candidate when there is one, for SUBJECT_ALL', async () => {
    mockEndpoints()
    const candidate = {
      dimensions: [
        {
          dimension: 'Desempeño Docente',
          target_type: 'DIMENSION',
          target_ref: 'Desempeño Docente',
          average: 4,
          below_threshold: false,
          suggestions: [],
          questions: [],
        },
      ],
    } as unknown as PlanCandidate

    const { result } = renderApiHook(() =>
      usePlanWorkbench({
        teacherId: 4,
        periodId: 10,
        periodName: '2028-1',
        threshold: 3.5,
        onlyWeak: false,
        subjectKey: SUBJECT_ALL,
        catalogue: CATALOGUE,
        candidate,
      }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.dimensions).toBe(candidate.dimensions)
  })

  it('falls back to the detail-built matrix teacher-wide without a candidate', async () => {
    mockEndpoints()

    const { result } = renderApiHook(() =>
      usePlanWorkbench({
        teacherId: 4,
        periodId: 10,
        periodName: '2028-1',
        threshold: 3.5,
        onlyWeak: false,
        subjectKey: SUBJECT_ALL,
        catalogue: CATALOGUE,
      }),
    )

    await waitFor(() => expect(result.current.isLoading).toBe(false))

    expect(result.current.dimensions[0].below_threshold).toBe(true)
  })
})
