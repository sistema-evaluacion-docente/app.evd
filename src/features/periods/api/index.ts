import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type { HistorySortBy, TeacherHistoryOut, TeacherPeriodHistory } from '../types'

interface TeacherHistoryParams {
  page?: number
  limit?: number
  search?: string
  sort_by?: HistorySortBy
}

async function getTeacherHistory(
  teacherId: number,
  params: TeacherHistoryParams,
): Promise<ResponseAPI<TeacherHistoryOut>> {
  return api.get(`/teachers/${teacherId}/history`, { params })
}

export const periodsKeys = {
  all: ['periods'] as const,
  history: (teacherId: number, params: TeacherHistoryParams) =>
    [...periodsKeys.all, 'history', teacherId, params] as const,
}

/**
 * Fetches the paginated evaluation history of the authenticated teacher across
 * all evaluated periods (`GET /teachers/{teacher_id}/history`) and flattens the
 * `items` list so it can be consumed directly by `DataTable`.
 *
 * @example
 * const { data, isPending } = useGetTeacherHistory({ page, limit, search });
 */
export function useGetTeacherHistory({
  page = 1,
  limit = 10,
  search = '',
  sort_by,
}: {
  page?: number
  limit?: number
  search?: string
  sort_by?: HistorySortBy
} = {}) {
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? 0

  return useQuery({
    queryKey: periodsKeys.history(teacherId, { page, limit, search, sort_by }),
    queryFn: async (): Promise<ResponseAPI<TeacherPeriodHistory[]>> => {
      const params: Record<string, unknown> = {}

      if (page) params['page'] = page
      if (limit) params['limit'] = limit
      if (search) params['search'] = search
      if (sort_by) params['sort_by'] = sort_by

      const response = await getTeacherHistory(teacherId, { ...params })
      const history = response.data

      return {
        ...response,
        data: history.items,
        pagination: {
          total: history.total,
          page: history.page,
          pages: history.pages,
          limit: history.limit,
        },
      }
    },
    enabled: teacherId > 0,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}
