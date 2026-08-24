import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetTeacherHistory } from '@/features/periods/api'
import TeacherMateriasPage from '@/features/periods/pages/TeacherMateriasPage'
import { useGetTeacherDetail } from '@/features/teachers'

vi.mock('@/features/periods/api', () => ({ useGetTeacherHistory: vi.fn() }))

// `PeriodSelect` pulls the catalogue and the store from the feature root; it
// has its own tests, and here it is only scenery around the empty states.
vi.mock('@/features/periods', () => ({
  useGetAcademicPeriods: () => ({ data: undefined, isLoading: false }),
  useAcademicPeriodsStore: (selector: (state: unknown) => unknown) =>
    selector({ periods: [], setPeriods: () => {} }),
}))

vi.mock('@/features/teachers', () => ({
  useGetTeacherDetail: vi.fn(),
  TeacherCourseResults: () => <div data-testid="course-results" />,
}))

/** `teacher_id` on the signed-in user is what tells the page whose materias to show. */
let teacherId: number | null = 3

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { teacher_id: teacherId } }),
}))

function renderPage({
  periods = [] as unknown[],
  isHistoryPending = false,
  teacher = undefined as unknown,
}) {
  vi.mocked(useGetTeacherHistory).mockReturnValue({
    data: isHistoryPending ? undefined : { data: periods },
    isPending: isHistoryPending,
  } as unknown as ReturnType<typeof useGetTeacherHistory>)

  vi.mocked(useGetTeacherDetail).mockReturnValue({
    data: teacher ? { data: teacher } : undefined,
    isLoading: false,
  } as unknown as ReturnType<typeof useGetTeacherDetail>)

  const { hook, history } = memoryLocation({ path: '/periodos/materias', record: true })

  render(
    <Router hook={hook}>
      <TeacherMateriasPage />
    </Router>,
  )

  return { history }
}

afterEach(() => {
  teacherId = 3
  vi.clearAllMocks()
})

describe('TeacherMateriasPage · sin materias que mostrar', () => {
  it('keeps its title and says what would fill the page', () => {
    // A bare sentence on a blank page reads like something broke; the teacher
    // has simply not been evaluated yet.
    renderPage({ periods: [] })

    expect(screen.getByText('Mis materias')).toBeInTheDocument()
    expect(screen.getByText('Aún no tiene evaluaciones registradas.')).toBeInTheDocument()
    expect(screen.getByText(/aparecerán aquí con su promedio/)).toBeInTheDocument()
  })

  it('offers the way back to the summary', async () => {
    const user = userEvent.setup()
    const { history } = renderPage({ periods: [] })

    await user.click(screen.getByRole('button', { name: 'Volver a mi resumen' }))

    expect(history[history.length - 1]).toBe('/home')
  })

  it('explains a user who is not linked to a teacher record', () => {
    teacherId = null
    renderPage({ periods: [] })

    expect(screen.getByText('Mis materias')).toBeInTheDocument()
    expect(
      screen.getByText('Su usuario no está vinculado a un registro de docente.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Volver a mi resumen' })).toBeInTheDocument()
  })

  it('points at the period selector when the period itself came back empty', () => {
    // The title and the selector are already on screen here, so changing the
    // period is the way out — not going back.
    renderPage({ periods: [{ period_id: 1, period_code: '2025-1', period_name: '2025-1' }] })

    expect(screen.getByText('No se encontraron materias para este periodo.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Volver a mi resumen' })).not.toBeInTheDocument()
  })

  it('shows the materias once there are any', () => {
    renderPage({
      periods: [{ period_id: 1, period_code: '2025-1', period_name: '2025-1' }],
      teacher: { courses: [], overall_average: 4.1, period_code: '2025-1' },
    })

    expect(screen.getByTestId('course-results')).toBeInTheDocument()
    expect(screen.queryByText('Aún no tiene evaluaciones registradas.')).not.toBeInTheDocument()
  })
})
