import type { UseQueryResult } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'

import type { HistorySortBy } from '@/features/teachers/api/getTeacherHistory'
import useGetTeacherHistory from '@/features/teachers/hooks/useGetTeacherHistory'
import type { TeacherHistoryEntry } from '@/features/teachers/types/Teacher'
import useAuth from '@/shared/hooks/useAuth'
import type { ResponseAPI } from '@/shared/types/Response'

type HistoryResponse = ResponseAPI<TeacherHistoryEntry[]>

/**
 * Custom hook to manage the teacher history table data and state.
 *
 * @param sortBy - Optional sorting criteria for the teacher history data.
 * @returns An object containing the query function, loading state, error state, and entries count.
 */
export default function useTeacherHistoryTable(sortBy?: HistorySortBy) {
  const { user } = useAuth()
  const teacherId = user?.teacher_id ?? 0

  const query = useGetTeacherHistory(teacherId, sortBy)

  const items = useMemo(() => query.data?.data?.items ?? [], [query.data])

  const mappedResult = useMemo<HistoryResponse>(
    () => ({
      status: 'success',
      message: '',
      data: items,
      error: null,
      pagination: {
        total: items.length,
        page: 1,
        pages: 1,
        limit: items.length || 10,
      },
    }),
    [items],
  )

  const queryFn = useCallback(
    () =>
      ({
        data: mappedResult,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        isError: query.isError,
        error: query.error,
        status: query.status,
        fetchStatus: query.fetchStatus,
        refetch: query.refetch,
      }) as unknown as UseQueryResult<HistoryResponse>,
    [
      mappedResult,
      query.isLoading,
      query.isFetching,
      query.isError,
      query.error,
      query.status,
      query.fetchStatus,
      query.refetch,
    ],
  )

  return {
    queryFn,
    hasTeacherId: teacherId > 0,
    isLoading: query.isLoading,
    isError: query.isError,
    entriesCount: items.length,
  }
}
