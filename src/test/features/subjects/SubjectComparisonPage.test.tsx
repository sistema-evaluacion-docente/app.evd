import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import type { TeacherComparisonEntry } from '@/features/stats'
import SubjectComparisonPage from '@/features/subjects/pages/SubjectComparisonPage'
import { renderRouted, screen } from '@/test/render'

/**
 * The side-by-side comparison of every teacher who taught one subject in a
 * period. One page test carries the ranking, the per-dimension breakdown and
 * the comments panel with it, since the page is what composes them.
 */

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

// recharts measures its container; jsdom reports nothing, so the chart view
// needs an observer that simply never fires.
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

function entry(overrides: Partial<TeacherComparisonEntry>): TeacherComparisonEntry {
  return {
    teacher_id: 1,
    teacher_name: 'Ada Lovelace',
    teacher_avatar_url: null,
    group_name: 'A',
    evaluation_id: 9,
    overall_average: 4.5,
    respondent_count: 20,
    dimensions: DIMENSIONS.map((dimension, index) => ({
      dimension,
      average: 4 + index * 0.1,
      questions: [{ code: `${index + 1}`, text: `Indicador ${index + 1}`, score: 4.2 }],
    })),
    comments_risk_counts: { BAJO: 3, MEDIO: 1, ALTO: 0 },
    comments_pedagogical_category_counts: { LABEL_0: 2, LABEL_1: 1 },
    ai_status: 'ANALYZED',
    ...overrides,
  } as TeacherComparisonEntry
}

const ENTRIES = [
  entry({}),
  entry({ teacher_id: 2, teacher_name: 'Grace Hopper', group_name: 'B', overall_average: 3.9 }),
]

const URL = '/materias/IS101/comparar?period=2028-1&name=C%C3%A1lculo'

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockResolvedValue({ data: ENTRIES })
})

describe('SubjectComparisonPage', () => {
  it('names the subject it is comparing and the period it covers', async () => {
    renderRouted(<SubjectComparisonPage />, { path: URL })

    expect(await screen.findByText(/Comparación de docentes: Cálculo/)).toBeInTheDocument()
    expect(screen.getByText('2028-1')).toBeInTheDocument()
  })

  it('asks the backend for that course and period', async () => {
    renderRouted(<SubjectComparisonPage />, { path: URL })

    await screen.findAllByText('Ada Lovelace')

    expect(mockApi.get).toHaveBeenCalledWith(
      '/stats/departments/subjects/IS101/teachers-comparison',
      { params: { period: '2028-1' } },
    )
  })

  it('drops a teacher the backend returned twice for the same group', async () => {
    mockApi.get.mockResolvedValue({ data: [ENTRIES[0], ENTRIES[0], ENTRIES[1]] })

    renderRouted(<SubjectComparisonPage />, { path: URL })

    // Both teachers are shown once per section, so the repeated entry must not
    // make Ada appear more often than Grace.
    const ada = await screen.findAllByText('Ada Lovelace')

    expect(ada).toHaveLength(screen.getAllByText('Grace Hopper').length)
  })

  it('says so when the URL carries no course or period to compare', () => {
    renderRouted(<SubjectComparisonPage />, { path: '/materias/IS101/comparar' })

    expect(
      screen.getByText('No se encontró información para esta comparación.'),
    ).toBeInTheDocument()
  })

  it('says so when nobody taught the subject that period', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderRouted(<SubjectComparisonPage />, { path: URL })

    expect(
      await screen.findByText('No hay docentes para comparar en esta materia y periodo.'),
    ).toBeInTheDocument()
  })

  it('surfaces a failed request instead of an empty page', async () => {
    mockApi.get.mockRejectedValue(new Error('El servidor no respondió'))

    renderRouted(<SubjectComparisonPage />, { path: URL })

    expect(await screen.findByText('El servidor no respondió')).toBeInTheDocument()
  })

  it('breaks the comparison down by pedagogical dimension', async () => {
    renderRouted(<SubjectComparisonPage />, { path: URL })

    await screen.findAllByText('Ada Lovelace')

    for (const dimension of DIMENSIONS) {
      expect(screen.getAllByText(dimension).length).toBeGreaterThan(0)
    }
  })

  it('switches the dimension breakdown between list and chart', async () => {
    const user = userEvent.setup()

    renderRouted(<SubjectComparisonPage />, { path: URL })
    await screen.findAllByText('Ada Lovelace')

    const list = screen.getByRole('button', { name: 'Lista' })
    const bars = screen.getByRole('button', { name: 'Barras' })

    expect(list).toHaveAttribute('aria-pressed', 'true')

    await user.click(bars)

    expect(bars).toHaveAttribute('aria-pressed', 'true')
    expect(list).toHaveAttribute('aria-pressed', 'false')
  })

  it('offers the PDF only once there is something to compare', async () => {
    renderRouted(<SubjectComparisonPage />, { path: URL })

    expect(
      await screen.findByRole('button', { name: 'Descargar reporte de comparación' }),
    ).toBeInTheDocument()
  })

  it('hides the PDF button when there is nothing to put in it', async () => {
    mockApi.get.mockResolvedValue({ data: [] })

    renderRouted(<SubjectComparisonPage />, { path: URL })

    await screen.findByText('No hay docentes para comparar en esta materia y periodo.')

    expect(
      screen.queryByRole('button', { name: 'Descargar reporte de comparación' }),
    ).not.toBeInTheDocument()
  })

  it('lets the director leave the comment summary out of the PDF', async () => {
    const user = userEvent.setup()

    renderRouted(<SubjectComparisonPage />, { path: URL })
    await screen.findAllByText('Ada Lovelace')

    const includeComments = screen.getByRole('switch')

    expect(includeComments).toBeChecked()
    await user.click(includeComments)
    expect(includeComments).not.toBeChecked()
  })

  it('breaks each teacher’s comments down by risk and by category', async () => {
    renderRouted(<SubjectComparisonPage />, { path: URL })

    await screen.findAllByText('Ada Lovelace')

    expect(screen.getAllByText('Nivel de riesgo').length).toBe(ENTRIES.length)
    expect(screen.getAllByText('Categoría pedagógica').length).toBe(ENTRIES.length)
  })

  it('says the classification is not in yet while the AI is still analysing', async () => {
    mockApi.get.mockResolvedValue({ data: [entry({ ai_status: 'ANALYZING' })] })

    renderRouted(<SubjectComparisonPage />, { path: URL })

    expect(
      await screen.findByText(
        'La clasificación de estos comentarios aparecerá cuando el análisis con IA termine.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Analizando')).toBeInTheDocument()
  })
})
