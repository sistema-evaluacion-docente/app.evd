import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import TeacherDetailPage from '@/features/teachers/pages/TeacherDetailPage'
import type { TeacherCommentsData, TeacherDetail } from '@/features/teachers/types'
import { renderRouted, screen } from '@/test/render'

/**
 * The director's report on one teacher for one period. It composes most of the
 * `teachers` feature — the overview hero, the dimension profile, the indicator
 * breakdown, the per-course results and the comments panel — so it is tested
 * as the page rather than component by component.
 */

vi.mock('@/config/axios', () => ({ default: { get: vi.fn(), post: vi.fn(), put: vi.fn() } }))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const selectedRole = { current: 'DIRECTOR DE DEPARTAMENTO' }

vi.mock('@/features/auth', () => ({
  ROLE: {
    ADMIN: 'ADMIN',
    TEACHER: 'DOCENTE',
    DEPARTMENT_DIRECTOR: 'DIRECTOR DE DEPARTAMENTO',
  },
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ selectedRole: selectedRole.current, user: { department_id: 3 } }),
}))

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
  group_count: 2,
  courses: [
    {
      course_code: 'IS101',
      course_name: 'Cálculo',
      group_name: 'A',
      respondent_count: 20,
      overall_average: 4.3,
      dimensions: dimensions(),
    },
  ],
  dimensions: dimensions(),
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
          id: 77,
          teacher_id: 4,
          evaluation_id: 9,
          academic_groups_id: 1,
          group_name: 'A',
          teacher_name: 'Ada Lovelace',
          teacher_avatar_url: '',
          course_name: 'Cálculo',
          original_text: 'Explica muy bien, pero califica lento.',
          risk_level: { id: 1, name: 'Bajo', color_hex: '#1baf7a' },
          risk_score: 0.2,
          pedagogical_categories: [{ id: 1, code: 'LABEL_0', name: 'Conocimiento', score: 0.9 }],
        },
      ],
    },
  ],
} as unknown as TeacherCommentsData

const mockApi = vi.mocked(api)

/** Serves each endpoint the page's subtree reaches for. */
function serve(overrides: Record<string, unknown> = {}) {
  mockApi.get.mockImplementation((url: string) => {
    for (const [fragment, value] of Object.entries(overrides)) {
      if (url.includes(fragment)) return Promise.resolve(value)
    }

    if (url.includes('/detail')) return Promise.resolve({ data: TEACHER })
    if (url.includes('/comments')) return Promise.resolve({ data: COMMENTS })
    if (url.includes('/improvement-plans/indicators')) return Promise.resolve({ data: {} })
    if (url.includes('/improvement-plans')) {
      return Promise.resolve({ data: [], pagination: { pages: 1 } })
    }

    return Promise.resolve({ data: [] })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  selectedRole.current = 'DIRECTOR DE DEPARTAMENTO'
  serve()
})

const URL = '/docentes/4?period=2028-1'

describe('TeacherDetailPage', () => {
  it('asks for the detail of the teacher in the URL, for the period in the query', async () => {
    renderRouted(<TeacherDetailPage />, { path: URL })

    expect(await screen.findAllByText('Ada Lovelace')).not.toHaveLength(0)
    expect(mockApi.get).toHaveBeenCalledWith('/evaluations/teachers/4/detail', {
      params: { period_name: '2028-1', compare_previous: true },
    })
  })

  it('shows every section of the report', async () => {
    renderRouted(<TeacherDetailPage />, { path: URL })

    await screen.findAllByText('Ada Lovelace')

    expect(screen.getByText('Perfil por dimensiones')).toBeInTheDocument()
    expect(screen.getByText('Indicadores del periodo')).toBeInTheDocument()
    expect(screen.getByText('Comentarios de los estudiantes')).toBeInTheDocument()
  })

  it('breaks the period down by dimension', async () => {
    renderRouted(<TeacherDetailPage />, { path: URL })

    await screen.findAllByText('Ada Lovelace')

    for (const dimension of DIMENSIONS) {
      expect(screen.getAllByText(dimension).length).toBeGreaterThan(0)
    }
  })

  it('lists the courses the teacher taught that period', async () => {
    renderRouted(<TeacherDetailPage />, { path: URL })

    expect(await screen.findAllByText(/Cálculo/)).not.toHaveLength(0)
  })

  it('shows the student comments verbatim', async () => {
    renderRouted(<TeacherDetailPage />, { path: URL })

    expect(await screen.findByText('Explica muy bien, pero califica lento.')).toBeInTheDocument()
  })

  it('says so when the period has no report for this teacher', async () => {
    serve({ '/detail': { data: null } })

    renderRouted(<TeacherDetailPage />, { path: URL })

    expect(await screen.findByText('No se encontró el docente.')).toBeInTheDocument()
  })

  it('offers the PDF of the report', async () => {
    renderRouted(<TeacherDetailPage />, { path: URL })

    await screen.findAllByText('Ada Lovelace')

    expect(screen.getByRole('button', { name: /Descargar|reporte/i })).toBeInTheDocument()
  })

  it('lets the department director start a plan from the report', async () => {
    renderRouted(<TeacherDetailPage />, { path: URL })

    await screen.findAllByText('Ada Lovelace')

    expect(
      await screen.findByRole('button', { name: 'Crear plan de mejoramiento' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Seleccionar indicadores' })).toBeInTheDocument()
  })

  it('leaves the plan action out for a teacher reading their own report', async () => {
    selectedRole.current = 'DOCENTE'

    renderRouted(<TeacherDetailPage />, { path: URL })

    await screen.findAllByText('Ada Lovelace')

    expect(
      screen.queryByRole('button', { name: 'Crear plan de mejoramiento' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Seleccionar indicadores' }),
    ).not.toBeInTheDocument()
  })

  it('turns the report into a picker once the director starts choosing indicators', async () => {
    const user = userEvent.setup()

    renderRouted(<TeacherDetailPage />, { path: URL })
    await screen.findByText('Explica muy bien, pero califica lento.')

    await user.click(await screen.findByRole('button', { name: 'Seleccionar indicadores' }))

    // The selection strip is the point: the report is now something a plan is
    // drawn from, not just read.
    expect(await screen.findByText('Marcando indicadores…')).toBeInTheDocument()
  })
})
