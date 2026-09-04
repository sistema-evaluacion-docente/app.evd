import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { TeacherCommentsSummary } from '@/features/teachers/components/TeacherCommentsSummary'
import type { TeacherCommentsData } from '@/features/teachers/types'
import { renderRouted, screen, within } from '@/test/render'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (s: unknown) => unknown) => selector({ user: { teacher_id: 4 } }),
}))

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
)

const mockApi = vi.mocked(api)

function comment(overrides: Partial<TeacherCommentsData['courses'][0]['comments'][0]> = {}) {
  return {
    id: 1,
    teacher_id: 4,
    evaluation_id: 9,
    academic_groups_id: 1,
    group_name: 'A',
    teacher_name: 'Ada Lovelace',
    teacher_avatar_url: '',
    course_name: 'Cálculo I',
    original_text: 'Buen manejo del tema',
    risk_level: { id: 1, name: 'BAJO', color_hex: '#22c55e' },
    risk_score: 0.1,
    pedagogical_categories: [
      { id: 1, name: 'LABEL_0', description: '', color_hex: '#3c8dbc', score: 0.8 },
    ],
    created_at: '2028-02-01T00:00:00Z',
    updated_at: '2028-02-01T00:00:00Z',
    ...overrides,
  }
}

function commentsData(comments: ReturnType<typeof comment>[], ai_status = 'ANALYZED') {
  return {
    teacher_id: 4,
    evaluation_id: 9,
    ai_status,
    courses: [{ course_code: 'CAL', course_name: 'Cálculo I', group_name: 'A', comments }],
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('TeacherCommentsSummary', () => {
  it('renders nothing without an evaluation id', () => {
    const { container } = renderRouted(<TeacherCommentsSummary teacherId={4} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the AI-pending notice instead of the charts', async () => {
    mockApi.get.mockResolvedValue({ data: commentsData([], 'ANALYZING') })

    renderRouted(<TeacherCommentsSummary evaluationId={9} teacherId={4} />)

    expect(await screen.findByText('Analizando')).toBeInTheDocument()
    expect(
      screen.getByText(/El resumen por riesgo y categoría aparecerá/),
    ).toBeInTheDocument()
  })

  it('shows the empty message when there are no comments', async () => {
    mockApi.get.mockResolvedValue({ data: commentsData([]) })

    renderRouted(<TeacherCommentsSummary evaluationId={9} teacherId={4} />)

    expect(
      await screen.findByText('Todavía no hay comentarios registrados para este periodo.'),
    ).toBeInTheDocument()
  })

  it('draws the risk and category donuts, and the highlighted risky comment', async () => {
    mockApi.get.mockResolvedValue({
      data: commentsData([
        comment({ id: 1, risk_level: { id: 1, name: 'BAJO', color_hex: '#22c55e' }, risk_score: 0.1 }),
        comment({
          id: 2,
          risk_score: 0.9,
          risk_level: { id: 3, name: 'ALTO', color_hex: '#ef4444' },
          original_text: 'Falta mucho a clase',
        }),
      ]),
    })

    renderRouted(<TeacherCommentsSummary evaluationId={9} teacherId={4} />)

    expect(await screen.findByText('Por nivel de riesgo')).toBeInTheDocument()
    expect(screen.getByText('Por categoría pedagógica')).toBeInTheDocument()
    expect(screen.getByText('Requiere más atención')).toBeInTheDocument()
    expect(screen.getByText('Falta mucho a clase')).toBeInTheDocument()
  })

  it('switches between the donut and the bar view', async () => {
    mockApi.get.mockResolvedValue({ data: commentsData([comment()]) })
    const user = userEvent.setup()

    renderRouted(<TeacherCommentsSummary evaluationId={9} teacherId={4} />)
    await screen.findByText('Por nivel de riesgo')

    const toggle = screen.getByRole('group', { name: 'Forma de ver el resumen' })
    const barButton = within(toggle).getByRole('button', { name: /Barra/ })

    expect(within(toggle).getByRole('button', { name: /Dona/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await user.click(barButton)

    expect(barButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('shows a percentage-point delta once a comparison period is given', async () => {
    mockApi.get.mockImplementation((url: string) => {
      // The two calls differ only by which evaluation id is baked into the URL.
      if (url === '/evaluations/9/teachers/4/comments') {
        return Promise.resolve({
          data: commentsData([comment({ risk_level: { id: 3, name: 'ALTO', color_hex: '#ef4444' } })]),
        })
      }
      return Promise.resolve({ data: commentsData([comment()]) })
    })

    renderRouted(
      <TeacherCommentsSummary evaluationId={9} previousEvaluationId={8} teacherId={4} />,
    )

    expect(await screen.findByText('Por nivel de riesgo')).toBeInTheDocument()
    // Both periods have exactly one comment, but at a different risk level —
    // the level that gained it shows a full +100pp swing.
    expect(screen.getByText('+100.0%')).toBeInTheDocument()
  })
})
