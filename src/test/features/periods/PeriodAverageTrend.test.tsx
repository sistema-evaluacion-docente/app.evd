import { describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import { PeriodAverageTrend } from '@/features/periods/components/PeriodAverageTrend'
import type { TeacherHistoryOut } from '@/features/periods/types'
import { renderWithProviders, screen, within } from '@/test/render'

/**
 * RF-5.8 — Comparación del desempeño de un docente entre dos periodos
 * académicos: la evolución de su promedio general a lo largo del tiempo, de
 * la que se leen dos puntos cualesquiera para compararlos. No hay un
 * endpoint de "comparar estos dos periodos" en el frontend — el backend
 * expone uno (`/comparison`), pero esta app nunca lo consume — así que la
 * comparación es justamente esta gráfica.
 */

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

const teacherId = { current: 7 as number | undefined }

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { teacher_id: teacherId.current } }),
}))

const mockApi = vi.mocked(api)

function history(overrides: Partial<TeacherHistoryOut> = {}): TeacherHistoryOut {
  return {
    teacher_id: 7,
    institutional_code: 'A1',
    name: 'Ada Lovelace',
    items: [
      {
        evaluation_id: 1,
        period_id: 1,
        period_code: '2027-2',
        period_name: '2027-2',
        overall_average: 3.6,
        group_count: 2,
      },
      {
        evaluation_id: 2,
        period_id: 2,
        period_code: '2028-1',
        period_name: '2028-1',
        overall_average: 4.2,
        group_count: 3,
      },
    ],
    total: 2,
    page: 1,
    limit: 12,
    pages: 1,
    ...overrides,
  }
}

function serve(data: TeacherHistoryOut = history()) {
  mockApi.get.mockImplementation((url: string) => {
    if (url.includes('/history')) return Promise.resolve({ data })

    return Promise.resolve({ data: [] })
  })
}

describe('PeriodAverageTrend', () => {
  it('no dibuja nada sin un docente al cual mostrar', () => {
    teacherId.current = undefined

    const { container } = renderWithProviders(<PeriodAverageTrend />)

    expect(container).toBeEmptyDOMElement()
    expect(mockApi.get).not.toHaveBeenCalled()
  })

  it('dibuja los dos periodos, para leer la comparación entre ellos', async () => {
    teacherId.current = 7
    serve()

    const { container } = renderWithProviders(<PeriodAverageTrend />)

    // El propio backend ordena por `period_code_asc`, así que el punto más
    // antiguo queda a la izquierda — leer "de un periodo a otro" en la
    // gráfica depende de que el orden no se invierta por accidente.
    expect(await within(container).findByText('2027-2')).toBeInTheDocument()
    expect(within(container).getByText('2028-1')).toBeInTheDocument()
  })

  it('pide el historial ordenado del más antiguo al más reciente', async () => {
    teacherId.current = 7
    serve()

    renderWithProviders(<PeriodAverageTrend />)

    await screen.findByText('2028-1')

    const [, config] = mockApi.get.mock.calls[0]!
    expect((config as { params: Record<string, string> }).params.sort_by).toBe('period_code_asc')
  })

  it('usa el docente autenticado cuando no se pasa uno explícito', async () => {
    teacherId.current = 9
    serve()

    renderWithProviders(<PeriodAverageTrend />)

    await screen.findByText('2028-1')

    expect(mockApi.get).toHaveBeenCalledWith('/teachers/9/history', expect.anything())
  })

  it('prefiere el docente que se le indique sobre el autenticado', async () => {
    teacherId.current = 9
    serve()

    renderWithProviders(<PeriodAverageTrend teacherId={42} />)

    await screen.findByText('2028-1')

    expect(mockApi.get).toHaveBeenCalledWith('/teachers/42/history', expect.anything())
  })

  it('muestra el título por defecto, y admite uno propio', async () => {
    teacherId.current = 7
    serve()

    const { rerender } = renderWithProviders(<PeriodAverageTrend />)

    expect(await screen.findByText('Evolución de mi promedio')).toBeInTheDocument()

    rerender(<PeriodAverageTrend title="Mi evolución reciente" />)

    expect(screen.getByText('Mi evolución reciente')).toBeInTheDocument()
  })

  it('dice que no hay periodos evaluados en vez de una gráfica vacía', async () => {
    teacherId.current = 7
    serve(history({ items: [], total: 0, pages: 0 }))

    renderWithProviders(<PeriodAverageTrend />)

    expect(
      await screen.findByText('Aún no hay periodos evaluados para dibujar una tendencia.'),
    ).toBeInTheDocument()
  })

  it('muestra junto al título el promedio histórico total que calcula el backend', async () => {
    teacherId.current = 7
    // 4.37 a propósito: no es la media de los dos puntos dibujados (3.9), así
    // que el test falla si la gráfica lo recalculara con solo lo que dibuja.
    serve(history({ historical_average: 4.37 }))

    const { container } = renderWithProviders(<PeriodAverageTrend />)

    const label = await within(container).findByText('Promedio histórico total')
    expect(within(container).getByText('4.37')).toBeInTheDocument()

    // En la misma fila que el título, no encima de la gráfica.
    expect(label.closest('div')).toContainElement(screen.getByText('Evolución de mi promedio'))
  })

  it('muestra el promedio histórico aunque la gráfica no lleve título', async () => {
    teacherId.current = 7
    serve(history({ historical_average: 4.37 }))

    const { container } = renderWithProviders(<PeriodAverageTrend title={null} />)

    expect(await within(container).findByText('Promedio histórico total')).toBeInTheDocument()
  })

  it('no muestra el promedio histórico si el backend no lo trae o se apaga', async () => {
    teacherId.current = 7
    serve(history({ historical_average: null }))

    const { container, rerender } = renderWithProviders(<PeriodAverageTrend />)

    await within(container).findByText('2028-1')
    expect(within(container).queryByText('Promedio histórico total')).not.toBeInTheDocument()

    serve(history({ historical_average: 4.37 }))
    rerender(<PeriodAverageTrend teacherId={8} showHistoricalAverage={false} />)

    await within(container).findByText('2028-1')
    expect(within(container).queryByText('Promedio histórico total')).not.toBeInTheDocument()
  })

  it('dibuja la meta institucional como referencia cuando se indica', async () => {
    teacherId.current = 7
    serve()

    const { container } = renderWithProviders(<PeriodAverageTrend target={4} />)

    await within(container).findByText('2028-1')

    expect(within(container).getByText('Meta')).toBeInTheDocument()
  })
})
