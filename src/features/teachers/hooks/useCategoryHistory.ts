import { useQueries } from '@tanstack/react-query'

import { getTeacherVsDepartment } from '@/features/evaluations'

import {
  buildCategoryHistory,
  type CategoryHistory,
  type ProfessorPeriod,
} from '../model/professorSummary'

export interface UseCategoryHistoryResult extends CategoryHistory {
  isLoading: boolean
  isError: boolean
}

/**
 * Hook to fetch the history of a teacher's category across multiple periods.
 *
 * @param teacherId - The ID of the teacher for whom to fetch the category history.
 * @param periods - An array of ProfessorPeriod objects representing the periods to fetch data for.
 * @param categoryId - The ID of the category to fetch history for.
 * @param enabled - A boolean indicating whether the query should be enabled. Defaults to true.
 * @returns An object containing the points, items, isLoading, and isError properties.
 */
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
