import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { CourseTeacherDetail } from '@/features/teachers/components/CourseTeacherDetail'
import type { CourseHistoryOut } from '@/features/teachers/types'
import type { TeacherCommentsData, TeacherDetail } from '@/features/teachers/types'
import { renderRouted, screen, waitFor, within } from '@/test/render'

/**
 * The report of one teacher's results in a single subject — the average,
 * period comparison, dimension ranking/breakdown, comments and trend chart.
 * Driven through a mocked axios so the real query hooks run.
 */

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const mockApi = vi.mocked(api)

const DIMENSIONS = [
  'Desarrollo del Conocimiento',
  'Desempeño Docente',
  'Procesos de Evaluación',
  'Integración Interpersonal',
]

function dimensions(base = 4) {
  return DIMENSIONS.map((dimension, index) => ({
    dimension,
    average: base + index * 0.1,
    questions: [{ code: `${index + 1}`, text: `Indicador ${index + 1}`, score: 4.2 }],
  }))
}

const TEACHER: TeacherDetail = {
  teacher_id: 4,
  institutional_code: 'A1',
  name: 'Ada Lovelace',
  avatar_url: '',
  contract_type: 'TIEMPO COMPLETO',
  evaluation_id: 9,
  period_code: '2028-1',
  period_name: '2028-1',
  overall_average: 4.25,
  group_count: 1,
  courses: [
    {
      course_code: 'IS101',
      course_name: 'Cálculo',
      group_name: 'A',
      respondent_count: 20,
      overall_average: 4.3,
      dimensions: dimensions(4.2),
    },
  ],
  dimensions: dimensions(4.2),
}

const HISTORY: CourseHistoryOut = {
  teacher_id: 4,
  course_code: 'IS101',
  course_name: 'Cálculo',
  items: [
    {
      academic_period_id: 1,
      period_code: '2027-2',
      period_name: '2027-2',
      group_name: 'A',
      respondent_count: 18,
      overall_average: 3.9,
      department_average: 3.8,
      dimensions: dimensions(3.6),
    },
  ],
}

const COMMENTS: TeacherCommentsData = {
  teacher_id: 4,
  evaluation_id: 9,
  ai_status: 'ANALYZED',
  courses: [
    {
      course_code: 'IS101',
      course_name: 'Cálculo',
      group_name: 'A',
      comments: [
        {
          id: 1,
          teacher_id: 4,
          evaluation_id: 9,
          academic_groups_id: 1,
          group_name: 'A',
          teacher_name: 'Ada Lovelace',
          teacher_avatar_url: '',
          course_name: 'Cálculo',
          original_text: 'Excelente clase',
          risk_level: { id: 1, name: 'BAJO', color_hex: '#22c55e' },
          risk_score: 0.1,
          pedagogical_categories: [
            { id: 1, name: 'LABEL_0', description: '', color_hex: '#3c8dbc', score: 0.9 },
          ],
          created_at: '2028-02-01T00:00:00Z',
          updated_at: '2028-02-01T00:00:00Z',
        },
      ],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()

  mockApi.get.mockImplementation((url: string) => {
    if (url === '/evaluations/teachers/4/detail') return Promise.resolve({ data: TEACHER })
    if (url === '/teachers/4/courses/IS101/history') return Promise.resolve({ data: HISTORY })
    if (url === '/evaluations/9/teachers/4/comments') return Promise.resolve({ data: COMMENTS })
    if (url.includes('/history')) {
      return Promise.resolve({
        data: { teacher_id: 4, course_code: '', course_name: null, items: [] },
      })
    }

    return Promise.resolve({ data: null })
  })
})

describe('CourseTeacherDetail', () => {
  it('renders the course header, average and dimension ranking', async () => {
    renderRouted(
      <CourseTeacherDetail teacherId={4} courseCode="IS101" groupName="A" period="2028-1" />,
    )

    expect(await screen.findByRole('heading', { name: 'Cálculo' })).toBeInTheDocument()
    expect(screen.getByText('IS101')).toBeInTheDocument()
    expect(screen.getByText('Grupo A')).toBeInTheDocument()
    expect(screen.getByText('Promedio en esta asignatura')).toBeInTheDocument()

    for (const dimension of DIMENSIONS) {
      expect(screen.getAllByText(dimension).length).toBeGreaterThan(0)
    }
  })

  it('shows a message when the course is not found in the period', async () => {
    renderRouted(
      <CourseTeacherDetail teacherId={4} courseCode="NOPE" groupName="Z" period="2028-1" />,
    )

    expect(
      await screen.findByText('No se encontró información para esta materia en el periodo indicado.'),
    ).toBeInTheDocument()
  })

  it('turns on the period comparison and shows mover badges against it', async () => {
    const user = userEvent.setup()

    renderRouted(
      <CourseTeacherDetail teacherId={4} courseCode="IS101" groupName="A" period="2028-1" />,
    )
    await screen.findByRole('heading', { name: 'Cálculo' })

    await user.click(await screen.findByText('Comparar con otro periodo'))

    await waitFor(() =>
      expect(
        screen.getByText(/Dimensiones pedagógicas comparadas con 2027-2/),
      ).toBeInTheDocument(),
    )
    expect(screen.getByText(/Mayor mejora/)).toBeInTheDocument()
  })

  it('shows the teacher identity and the PDF button when requested', async () => {
    renderRouted(
      <CourseTeacherDetail
        teacherId={4}
        courseCode="IS101"
        groupName="A"
        period="2028-1"
        showTeacherIdentity
      />,
    )

    await screen.findByRole('heading', { name: 'Cálculo' })

    expect(screen.getAllByText('Ada Lovelace').length).toBeGreaterThan(0)
    expect(
      screen.getByRole('button', { name: 'Descargar reporte de la materia' }),
    ).toBeInTheDocument()
  })

  it('shows the comments and the student comments panel', async () => {
    renderRouted(
      <CourseTeacherDetail teacherId={4} courseCode="IS101" groupName="A" period="2028-1" />,
    )

    const panel = (await screen.findByText('Comentarios de los estudiantes')).closest('section')!
    expect(await within(panel).findByText('Excelente clase')).toBeInTheDocument()
  })
})
