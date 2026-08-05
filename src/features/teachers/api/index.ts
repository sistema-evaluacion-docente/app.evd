import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type { TeacherRecord } from '../types'

interface TeacherListParams {
  page: number
  limit: number
  academic_period_id: number
  search?: string
  department_id?: number
}

/** Raw request functions. Not exported — call through the hooks below. */

async function getTeachersWithAverages(
  params: TeacherListParams,
): Promise<ResponseAPI<TeacherRecord[]>> {
  const query: Record<string, unknown> = {
    page: params.page,
    limit: params.limit,
    academic_period_id: params.academic_period_id,
  }

  if (params.search) query['search'] = params.search
  if (params.department_id) query['department_id'] = params.department_id

  return api.get('/teachers/with-averages', { params: query })
}

/** Query-key factory so list invalidations stay consistent. */
export const teachersKeys = {
  all: ['teachers'] as const,
  lists: () => [...teachersKeys.all, 'list'] as const,
}

/**
 * Fetches the paginated list of teachers with their averages of the
 * authenticated director's department for an academic period
 * (`GET /teachers/with-averages`). The department id is read from the auth
 * store and always sent so results stay scoped to the current user.
 *
 * @example
 * const { data, isPending } = useGetTeachers({ page, limit, academicPeriodId: 1, search });
 */
export function useGetTeachers({
  page = 1,
  limit = 10,
  academicPeriodId,
  search = '',
}: {
  page?: number
  limit?: number
  academicPeriodId?: number
  search?: string
}) {
  const departmentId = useAuthStore((state) => state.user?.department_id) ?? undefined

  const params: TeacherListParams | null =
    departmentId != null && academicPeriodId != null
      ? { page, limit, academic_period_id: academicPeriodId, search, department_id: departmentId }
      : null

  return useQuery({
    queryKey: [
      ...teachersKeys.lists(),
      { page, limit, academicPeriodId, search, department_id: departmentId },
    ],
    queryFn: () => getTeachersWithAverages(params!),
    enabled: params !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}
