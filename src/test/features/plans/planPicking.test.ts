import { describe, expect, it } from 'vitest'

import { countRisky, groupComments, isRiskyComment } from '@/features/plans/lib/commentGroups'
import {
  buildCommentDraft,
  buildIndicatorDraft,
  coursesOfSubject,
  mergeCourses,
  pruneCourses,
} from '@/features/plans/lib/planDraft'
import type { DraftCourse, PlanSubjectOption } from '@/features/plans'
import type { TeacherComment, TeacherCommentsCourse } from '@/features/teachers/types'

function comment(id: number, risk: string, categories: string[]): TeacherComment {
  return {
    id,
    teacher_id: 1,
    evaluation_id: 1,
    academic_groups_id: 7,
    group_name: 'A',
    teacher_name: 'Docente',
    teacher_avatar_url: '',
    course_name: 'Cálculo I',
    original_text: `Comentario ${id}`,
    risk_level: { id: 1, name: risk, color_hex: '#000000' },
    risk_score: 0.9,
    pedagogical_categories: categories.map((name, index) => ({
      id: index,
      name,
      description: '',
      color_hex: '',
      score: 0.8,
    })),
    created_at: '',
    updated_at: '',
  }
}

const COURSES: TeacherCommentsCourse[] = [
  {
    course_code: 'CAL',
    course_name: 'Cálculo I',
    group_name: 'A',
    comments: [
      comment(1, 'ALTO', ['LABEL_0']),
      comment(2, 'BAJO', ['LABEL_4']),
      comment(3, 'MEDIO', ['LABEL_1', 'LABEL_2']),
    ],
  },
  {
    course_code: 'FIS',
    course_name: 'Física I',
    group_name: 'B',
    comments: [comment(4, 'ALTO', ['LABEL_0'])],
  },
]

const SUBJECT: PlanSubjectOption = {
  key: 'CAL::A',
  label: 'Cálculo I · Grupo A',
  course_name: 'Cálculo I',
  course_code: 'CAL',
  group_name: 'A',
  academic_group_id: 7,
  program_name: 'INGENIERIA DE SISTEMAS',
  weakCount: 0,
  riskyCount: 0,
}

const OTHER_SUBJECT: PlanSubjectOption = {
  key: 'FIS::B',
  label: 'Física I · Grupo B',
  course_name: 'Física I',
  course_code: 'FIS',
  group_name: 'B',
  academic_group_id: 8,
  program_name: 'INGENIERIA INDUSTRIAL',
  weakCount: 0,
  riskyCount: 0,
}

describe('groupComments', () => {
  it('files each comment under the dimension its category mirrors', () => {
    const { byDimension, uncategorized } = groupComments(COURSES)

    expect(byDimension['Desarrollo del Conocimiento'].map((entry) => entry.id)).toEqual([1, 4])
    expect(byDimension['Desempeño Docente'].map((entry) => entry.id)).toEqual([3])
    expect(byDimension['Procesos de Evaluación'].map((entry) => entry.id)).toEqual([3])
    expect(uncategorized.map((entry) => entry.id)).toEqual([2])
  })

  it('narrows to one subject when asked', () => {
    const { byDimension } = groupComments(COURSES, 'FIS::B')

    expect(byDimension['Desarrollo del Conocimiento'].map((entry) => entry.id)).toEqual([4])
  })

  it('counts medium and high risk once per comment', () => {
    expect(isRiskyComment(comment(9, 'BAJO', []))).toBe(false)
    expect(isRiskyComment(comment(9, 'MEDIO', []))).toBe(true)
    // Comment 3 is filed under two dimensions but is a single risky comment.
    expect(countRisky(groupComments(COURSES))).toBe(3)
  })
})

describe('picking drives the asignaturas', () => {
  it('adds every subject of the teacher when picking at the general level', () => {
    const courses = mergeCourses([], coursesOfSubject(null, [SUBJECT, OTHER_SUBJECT]))

    expect(courses.map((course) => course.course_name)).toEqual(['Cálculo I', 'Física I'])
    expect(courses.every((course) => course.origin === 'auto')).toBe(true)
  })

  it('accumulates subjects without duplicating them', () => {
    const first = mergeCourses([], coursesOfSubject(SUBJECT, []))
    const second = mergeCourses(first, coursesOfSubject(OTHER_SUBJECT, []))
    const again = mergeCourses(second, coursesOfSubject(SUBJECT, []))

    expect(again).toHaveLength(2)
    expect(again.map((course) => course.order)).toEqual([0, 1])
  })

  it('drops the auto rows nothing justifies any more, keeping the manual ones', () => {
    const draft = buildIndicatorDraft(
      {
        target_type: 'DIMENSION',
        target_ref: 'Desempeño Docente',
        label: 'Desempeño Docente',
        average: 3.1,
        aspect: 2,
        suggestions: [],
      },
      SUBJECT,
    )

    const manual: DraftCourse = {
      key: 'manual-1',
      origin: 'manual',
      course_name: 'Escrita a mano',
      order: 2,
    }

    const courses = [
      ...mergeCourses([], coursesOfSubject(SUBJECT, [])),
      ...mergeCourses([], coursesOfSubject(OTHER_SUBJECT, [])),
      manual,
    ]

    const kept = pruneCourses(courses, [draft])

    expect(kept.map((course) => course.course_name)).toEqual(['Cálculo I', 'Escrita a mano'])
  })

  it('keeps every subject while a teacher-level commitment stands', () => {
    const draft = buildIndicatorDraft(
      {
        target_type: 'QUESTION',
        target_ref: '011',
        label: '011 · Asiste puntualmente a clase.',
        average: 2.9,
        aspect: 2,
        suggestions: [],
      },
      null,
    )

    const courses = mergeCourses([], coursesOfSubject(null, [SUBJECT, OTHER_SUBJECT]))

    expect(pruneCourses(courses, [draft])).toHaveLength(2)
    expect(draft.baseline_value).toBe(2.9)
    // Empty on purpose: the meta esperada is the director's to decide, and
    // seeded with the threshold nobody ever looked at it again.
    expect(draft.target_value).toBeNull()
  })
})

describe('buildCommentDraft', () => {
  it('cites the comment on aspect 5, where the official form prints them', () => {
    const draft = buildCommentDraft(comment(1, 'ALTO', ['LABEL_0']), SUBJECT)

    expect(draft.aspect).toBe(5)
    expect(draft.target_type).toBe('QUALITATIVE')
    expect(draft.comment_ids).toEqual([1])
    expect(draft.comment_previews[0].text).toBe('Comentario 1')
    expect(draft.source_subject_label).toBe('Cálculo I · Grupo A')
  })
})
