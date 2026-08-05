import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type {
  AcademicPeriod,
  HistorySortBy,
  TeacherHistoryOut,
  TeacherPeriodHistory,
} from '../types'

interface TeacherHistoryParams {
  page?: number
  limit?: number
  search?: string
  sort_by?: HistorySortBy
}

interface AcademicPeriodParams {
  page: number
  limit: number
  search?: string
  active?: boolean
}

export interface CreateAcademicPeriodPayload {
  name: string
  start_date: string
  end_date: string
  evaluation_end_date?: string
  final_evaluation_date?: string
}

export interface UpdateAcademicPeriodPayload {
  name: string
  start_date: string
  end_date: string
  evaluation_end_date?: string
  final_evaluation_date?: string
  active: boolean
}

async function getAcademicPeriods(): Promise<ResponseAPI<AcademicPeriod[]>> {
  return api.get('/academic-periods', { params: { limit: 100 } })
}

async function getAcademicPeriodsAdmin(
  params: AcademicPeriodParams,
): Promise<ResponseAPI<AcademicPeriod[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.active !== undefined) query['active'] = params.active

  return api.get('/academic-periods/', { params: query })
}

async function createAcademicPeriod(
  payload: CreateAcademicPeriodPayload,
): Promise<ResponseAPI<AcademicPeriod>> {
  return api.post('/academic-periods/', payload)
}

async function updateAcademicPeriod(
  periodId: number,
  payload: UpdateAcademicPeriodPayload,
): Promise<ResponseAPI<AcademicPeriod>> {
  return api.put(`/academic-periods/${periodId}`, payload)
}

async function deleteAcademicPeriod(periodId: number): Promise<ResponseAPI<void>> {
  return api.delete(`/academic-periods/${periodId}`)
}

async function getTeacherHistory(
  teacherId: number,
  params: TeacherHistoryParams,
): Promise<ResponseAPI<TeacherHistoryOut>> {
  return api.get(`/teachers/${teacherId}/history`, { params })
}

export const periodsKeys = {
  all: ['periods'] as const,
  lists: () => [...periodsKeys.all, 'list'] as const,
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

/**
 * Fetches the list of academic periods to populate the period filter select
 * (`GET /academic-periods`). Cached for 5 minutes.
 *
 * @example
 * const { data: periods, isLoading } = useGetAcademicPeriods();
 */
export function useGetAcademicPeriods() {
  return useQuery({
    queryKey: periodsKeys.all,
    queryFn: getAcademicPeriods,
    staleTime: 300_000,
  })
}

/**
 * Fetches the paginated list of academic periods (`GET /academic-periods/`) with optional
 * search and active status filters. For admin use.
 *
 * @example
 * const { data, isPending } = useGetAcademicPeriodsAdmin({ page: 1, limit: 10 });
 */
export function useGetAcademicPeriodsAdmin({
  page = 1,
  limit = 10,
  search = '',
  active,
}: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
} = {}) {
  return useQuery({
    queryKey: [...periodsKeys.lists(), { page, limit, search, active }],
    queryFn: () =>
      getAcademicPeriodsAdmin({
        page,
        limit,
        search,
        active,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Creates a new academic period record (`POST /academic-periods/`).
 * Invalidates the periods list on success.
 *
 * @example
 * const { mutate: createPeriod } = useCreateAcademicPeriod();
 * createPeriod({ code: '2024-1', name: '2024 Primer Semestre', ... });
 */
export function useCreateAcademicPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAcademicPeriodPayload) => createAcademicPeriod(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: periodsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: periodsKeys.all })
    },
  })
}

/**
 * Updates an academic period record (`PUT /academic-periods/{period_id}`).
 * Invalidates the periods list on success.
 *
 * @example
 * const { mutate: updatePeriod } = useUpdateAcademicPeriod();
 * updatePeriod({ periodId: 1, payload: { ... } });
 */
export function useUpdateAcademicPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      periodId,
      payload,
    }: {
      periodId: number
      payload: UpdateAcademicPeriodPayload
    }) => updateAcademicPeriod(periodId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: periodsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: periodsKeys.all })
    },
  })
}

/**
 * Deletes an academic period record (`DELETE /academic-periods/{period_id}`).
 * Invalidates the periods list on success.
 *
 * @example
 * const { mutate: deletePeriod } = useDeleteAcademicPeriod();
 * deletePeriod(1);
 */
export function useDeleteAcademicPeriod() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (periodId: number) => deleteAcademicPeriod(periodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: periodsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: periodsKeys.all })
    },
  })
}
