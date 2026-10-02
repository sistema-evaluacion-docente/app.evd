import { describe, expect, it, vi } from 'vitest'

import DashboardPage from '@/features/dashboard/pages/DashboardPage'
import useAuth from '@/hooks/useAuth'
import { renderRouted } from '@/test/render'

vi.mock('@/hooks/useAuth')

// Los resúmenes de cada rol no son lo que se prueba aquí.
vi.mock('@/features/auth', () => ({ UserNotAuth: () => null }))
vi.mock('@/features/periods', () => ({ PeriodAverageTrend: () => null }))
vi.mock('@/features/stats', () => ({
  DepartmentPeriodRangeSummary: () => null,
  FacultiesOverview: () => null,
  FacultyPeriodSummary: () => null,
}))
vi.mock('@/features/teachers', () => ({
  TeacherPeriodInsights: () => null,
  TeacherStatsHero: () => null,
}))

describe('DashboardPage', () => {
  it('sends the admin, who has no summary of its own, to the faculties', () => {
    vi.mocked(useAuth).mockReturnValue({
      selectedRole: 'ADMIN',
      user: null,
    } as unknown as ReturnType<typeof useAuth>)

    const { history } = renderRouted(<DashboardPage />, { path: '/home' })

    expect(history.at(-1)).toBe('/admin/facultades')
  })
})
