import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import EvaluationDetailPage from '@/features/evaluations/pages/EvaluationDetailPage'
import type { EvaluationRecord } from '@/features/evaluations/types'
import { renderRouted, screen, waitFor } from '@/test/render'

/**
 * The report of one uploaded evaluation: the overview hero, the per-dimension
 * averages and the ranked teacher table. Also the screen the AI analysis is
 * kicked off from, and the one that switches between modalities.
 */

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

vi.mock('@/features/auth', () => ({
  ROLE: { ADMIN: 'ADMIN', TEACHER: 'DOCENTE', DEPARTMENT_DIRECTOR: 'DIRECTOR DE DEPARTAMENTO' },
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ selectedRole: 'DIRECTOR DE DEPARTAMENTO', user: { department_id: 3 } }),
}))

const DIMENSIONS = [
  'Desarrollo del Conocimiento',
  'Desempeño Docente',
  'Procesos de Evaluación',
  'Integración Interpersonal',
]

function evaluation(overrides: Partial<EvaluationRecord> = {}): EvaluationRecord {
  return {
    id: 9,
    user_id: 1,
    academic_period_id: 4,
    academic_period_name: '2028-1',
    academic_period_code: '2028-1',
    department_id: 3,
    pdf_url: 'evaluacion.pdf',
    active: true,
    status: 'COMPLETED',
    ai_status: 'ANALYZED',
    count: 12,
    overall_average: 4.25,
    comments_risk_counts: { BAJO: 30, MEDIO: 8, ALTO: 2 },
    dimension_averages: DIMENSIONS.map((dimension, index) => ({
      dimension,
      average: 4 + index * 0.1,
      question_count: 1,
      questions: [{ code: `${index + 1}`, text: `Indicador ${index + 1}`, score: 4.2 }],
    })),
    created_at: '2028-02-01T00:00:00Z',
    updated_at: '2028-02-01T00:00:00Z',
    ...overrides,
  } as EvaluationRecord
}

const TEACHERS = [
  {
    teacher_id: 4,
    institutional_code: 'A1',
    contract_type: 'TIEMPO COMPLETO',
    overall_average: 4.5,
    high_risk_comments_count: 0,
    user: { name: 'Ada Lovelace' },
  },
]

const mockApi = vi.mocked(api)

function serve(record: EvaluationRecord | null = evaluation()) {
  mockApi.get.mockImplementation((url: string) => {
    if (url.includes('/with-averages')) {
      return Promise.resolve({ data: TEACHERS, pagination: { pages: 1 } })
    }
    if (url.startsWith('/evaluations/9')) return Promise.resolve({ data: record })

    return Promise.resolve({ data: [] })
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  serve()
  mockApi.post.mockResolvedValue({ data: {} })
})

const URL = '/evaluaciones/9'

describe('EvaluationDetailPage', () => {
  it('fetches the evaluation named in the URL', async () => {
    renderRouted(<EvaluationDetailPage />, { path: URL })

    await screen.findByText('Promedios por dimensión pedagógica')

    expect(mockApi.get).toHaveBeenCalledWith('/evaluations/9', { params: { modality: undefined } })
  })

  it('shows the period, the averages and the dimension breakdown', async () => {
    renderRouted(<EvaluationDetailPage />, { path: URL })

    expect(await screen.findByText('Promedios por dimensión pedagógica')).toBeInTheDocument()

    for (const dimension of DIMENSIONS) {
      expect(screen.getAllByText(dimension).length).toBeGreaterThan(0)
    }
  })

  it('says so when the evaluation does not exist, and offers the way back', async () => {
    serve(null)

    renderRouted(<EvaluationDetailPage />, { path: URL })

    expect(await screen.findByText('No se encontró la evaluación.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver a evaluaciones' })).toBeInTheDocument()
  })

  it('carries the modality from the URL into the request', async () => {
    renderRouted(<EvaluationDetailPage />, { path: `${URL}?modality=DISTANCIA` })

    await screen.findByText('Promedios por dimensión pedagógica')

    expect(mockApi.get).toHaveBeenCalledWith('/evaluations/9', {
      params: { modality: 'DISTANCIA' },
    })
  })

  it('lets the director start the AI analysis', async () => {
    const user = userEvent.setup()

    serve(evaluation({ ai_status: 'PENDING' }))

    renderRouted(<EvaluationDetailPage />, { path: URL })

    const analyze = await screen.findByRole('button', { name: /Analizar/i })
    await user.click(analyze)

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledWith('/evaluations/9/analyze'))
  })

  it('compares against the previous period when the backend sent one', async () => {
    serve(
      evaluation({
        comparison: {
          previous_period_code: '2027-2',
          previous_period_name: '2027-2',
          current_average: 4.25,
          old_average: 4.0,
          average_difference: 0.25,
          dimensions: DIMENSIONS.map((dimension) => ({
            dimension,
            current_average: 4.2,
            old_average: 4.0,
            difference: 0.2,
            questions: [],
          })),
        },
      }),
    )

    renderRouted(<EvaluationDetailPage />, { path: URL })

    expect(await screen.findByText(/comparadas con 2027-2/)).toBeInTheDocument()
  })

  it('lets the director leave the teacher list out of the PDF', async () => {
    const user = userEvent.setup()

    renderRouted(<EvaluationDetailPage />, { path: URL })

    await screen.findByText('Promedios por dimensión pedagógica')

    const includeTeachers = screen.getByRole('switch')

    expect(includeTeachers).toBeChecked()
    await user.click(includeTeachers)
    expect(includeTeachers).not.toBeChecked()
  })

  it('links on to the dimension detail and the course review', async () => {
    renderRouted(<EvaluationDetailPage />, { path: URL })

    await screen.findByText('Promedios por dimensión pedagógica')

    // Rendered as anchors through the `Button` primitive, so they carry a real
    // href even though they report as buttons.
    expect(screen.getByRole('button', { name: 'Ver detalle' })).toHaveAttribute(
      'href',
      '/evaluaciones/9/dimensiones',
    )
    expect(screen.getByRole('button', { name: 'Revisar materias' })).toHaveAttribute(
      'href',
      '/evaluaciones/9/materias',
    )
    expect(screen.getByRole('button', { name: 'Ver PDF' })).toHaveAttribute(
      'href',
      '/evaluaciones/9/pdf',
    )
  })

  it('ranks the evaluated teachers', async () => {
    renderRouted(<EvaluationDetailPage />, { path: URL })

    expect(await screen.findAllByText('Ada Lovelace')).not.toHaveLength(0)
  })
})
