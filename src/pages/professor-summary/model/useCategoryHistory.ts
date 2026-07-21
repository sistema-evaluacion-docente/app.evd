import { useQueries } from '@tanstack/react-query'

import { getTeacherVsDepartment } from '@/features/evaluations'

import { buildCategoryHistory, type CategoryHistory, type ProfessorPeriod } from './data'

export interface UseCategoryHistoryResult extends CategoryHistory {
  isLoading: boolean
  isError: boolean
}

export function useCategoryHistory(
  teacherId: number,
  periods: ProfessorPeriod[],
  categoryId: string,
  enabled = true,
): UseCategoryHistoryResult {
  const queries = useQueries({
    queries: periods.map((period) => ({
      queryKey: ['teacher-vs-department', teacherId, period.periodId],
      queryFn: () => getTeacherVsDepartment(teacherId, period.periodId),
      enabled: enabled && teacherId > 0 && period.periodId > 0,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const entries = periods.map((period, index) => ({
    period,
    data: queries[index]?.data?.data,
  }))

  const { points, items } = buildCategoryHistory(entries, categoryId)

  return {
    points,
    items,
    isLoading: enabled && queries.some((query) => query.isLoading),
    isError: queries.some((query) => query.isError),
  }
}
