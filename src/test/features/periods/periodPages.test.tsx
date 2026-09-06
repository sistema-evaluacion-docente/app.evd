import { beforeEach, describe, expect, it, vi } from 'vitest'

import PeriodCourseDetailPage from '@/features/periods/pages/PeriodCourseDetailPage'
import PeriodDetailPage from '@/features/periods/pages/PeriodDetailPage'
import { useGetTeacherDetail } from '@/features/teachers'
import type { TeacherDetail } from '@/features/teachers/types'
import { renderRouted, screen } from '@/test/render'

/**
 * Both pages are thin wrappers around the shared teacher-report components
 * (already tested on their own — `TeacherEvaluationDetail` via
 * `TeacherDetailPage`, `CourseTeacherDetail` directly): what's pinned down
 * here is the page-level plumbing — resolving the authenticated teacher,
 * the loading/not-found states, and the prev/next materia navigation.
 */

const authTeacherId = { current: 4 as number | null }

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) =>
    selector({ user: authTeacherId.current != null ? { teacher_id: authTeacherId.current } : null }),
}))

vi.mock('@/features/teachers', () => ({
  useGetTeacherDetail: vi.fn(),
  TeacherEvaluationDetail: ({ teacher }: { teacher: TeacherDetail }) => (
    <div data-testid="teacher-evaluation-detail">{teacher.name}</div>
  ),
  CourseTeacherDetail: ({ courseCode, groupName }: { courseCode: string; groupName: string }) => (
    <div data-testid="course-teacher-detail">
      {courseCode} - {groupName}
    </div>
  ),
}))

const DIMENSIONS = [{ dimension: 'Desempeño Docente', average: 4.2, questions: [] }]

const TEACHER: TeacherDetail = {
  teacher_id: 4,
  institutional_code: 'A1',
  name: 'Ada Lovelace',
  avatar_url: '',
  contract_type: 'TIEMPO COMPLETO',
  evaluation_id: 9,
  period_code: '2028-1',
  period_name: '2028-1',
  overall_average: 4.2,
  group_count: 2,
  courses: [
    {
      course_code: 'CAL',
      course_name: 'Cálculo I',
      group_name: 'A',
      respondent_count: 10,
      overall_average: 4.2,
      dimensions: DIMENSIONS,
    },
    {
      course_code: 'FIS',
      course_name: 'Física I',
      group_name: 'B',
      respondent_count: 8,
      overall_average: 4.0,
      dimensions: DIMENSIONS,
    },
  ],
  dimensions: DIMENSIONS,
}

function mockDetail(data: TeacherDetail | undefined, isLoading = false) {
  vi.mocked(useGetTeacherDetail).mockReturnValue({
    data: data ? { data } : undefined,
    isLoading,
  } as unknown as ReturnType<typeof useGetTeacherDetail>)
}

beforeEach(() => {
  vi.clearAllMocks()
  authTeacherId.current = 4
})

describe('PeriodDetailPage', () => {
  it('says the account is unlinked when there is no teacher_id', () => {
    authTeacherId.current = null
    mockDetail(undefined)

    renderRouted(<PeriodDetailPage />, { path: '/periodos/2028-1' })

    expect(
      screen.getByText(
        'Su usuario no está vinculado a un registro de docente. Contacte al administrador del sistema.',
      ),
    ).toBeInTheDocument()
  })

  it('reports no results for a period the teacher has none in', () => {
    mockDetail(undefined)

    renderRouted(<PeriodDetailPage />, { path: '/periodos/2099-1' })

    expect(
      screen.getByText('No se encontraron resultados para el periodo 2099-1.'),
    ).toBeInTheDocument()
  })

  it('renders the teacher evaluation detail once the data arrives', () => {
    mockDetail(TEACHER)

    renderRouted(<PeriodDetailPage />, { path: '/periodos/2028-1' })

    expect(screen.getByTestId('teacher-evaluation-detail')).toHaveTextContent('Ada Lovelace')
  })
})

describe('PeriodCourseDetailPage', () => {
  it('shows the previous/next materia navigation and the shared detail', () => {
    mockDetail(TEACHER)

    renderRouted(<PeriodCourseDetailPage />, { path: '/periodos/2028-1/materias/FIS/B' })

    expect(screen.getByTestId('course-teacher-detail')).toHaveTextContent('FIS - B')
    expect(screen.getByText('Materia anterior')).toBeInTheDocument()
    expect(screen.getByText('Cálculo I')).toBeInTheDocument()
  })

  it('reports nothing found for a materia outside the period', () => {
    mockDetail(TEACHER)

    renderRouted(<PeriodCourseDetailPage />, { path: '/periodos/2028-1/materias/NOPE/Z' })

    expect(
      screen.getByText('No se encontró información para esta materia en el periodo indicado.'),
    ).toBeInTheDocument()
  })
})
