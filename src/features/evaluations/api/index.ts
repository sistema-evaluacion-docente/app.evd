import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type { EvaluationRecord, EvaluationStatusUpdate } from '../types'

interface EvaluationListParams {
  page: number
  limit: number
  search: string
  sort_by?: string
  period_id?: number | string
  active?: boolean
  status?: string
  ai_status?: string
  department_id?: number
}

/** Raw request functions. Not exported — call through the hooks below. */

async function getEvaluations(
  params: EvaluationListParams,
): Promise<ResponseAPI<EvaluationRecord[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.sort_by) query['sort_by'] = params.sort_by
  if (params.period_id) query['period_id'] = params.period_id
  if (params.active !== undefined) query['active'] = params.active
  if (params.status) query['status'] = params.status
  if (params.ai_status) query['ai_status'] = params.ai_status
  if (params.department_id) query['department_id'] = params.department_id

  return api.get('/evaluations', { params: query })
}

async function getEvaluationByPeriod(periodId: number): Promise<ResponseAPI<EvaluationRecord>> {
  return api.get(`/evaluations/by-period/${periodId}`)
}

async function updateEvaluationStatus(
  evaluationId: number,
  payload: EvaluationStatusUpdate,
): Promise<ResponseAPI<EvaluationRecord>> {
  return api.patch(`/evaluations/${evaluationId}/status`, payload)
}

async function deleteEvaluation(evaluationId: number): Promise<ResponseAPI<null>> {
  return api.delete(`/evaluations/${evaluationId}`)
}

async function analyzeEvaluation(evaluationId: number): Promise<ResponseAPI<EvaluationRecord>> {
  return api.post(`/evaluations/${evaluationId}/analyze`)
}

async function uploadEvaluation(file: File): Promise<ResponseAPI<EvaluationRecord>> {
  const formData = new FormData()
  formData.append('file', file)

  return api.post('/evaluations/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** Query-key factory so list invalidations stay consistent. */
export const evaluationsKeys = {
  all: ['evaluations'] as const,
  lists: () => [...evaluationsKeys.all, 'list'] as const,
  detail: (periodId: number) => [...evaluationsKeys.all, 'detail', periodId] as const,
}

/**
 * Fetches the evaluation of an academic period (`GET /evaluations/by-period/{period_id}`).
 *
 * @example
 * const { data, isLoading } = useGetEvaluationByPeriod(periodId);
 */
export function useGetEvaluationByPeriod(periodId?: number) {
  return useQuery({
    queryKey: evaluationsKeys.detail(periodId ?? 0),
    queryFn: () => getEvaluationByPeriod(periodId!),
    enabled: periodId != null,
    staleTime: 60_000,
  })
}

/**
 * Fetches the paginated evaluations of the authenticated director's department
 * (`GET /evaluations`). The department id is read from the auth store and always
 * sent so results stay scoped to the current user.
 *
 * @example
 * const { data, isPending } = useGetEvaluations({ page, limit, search });
 */
export function useGetEvaluations({
  page = 1,
  limit = 10,
  search = '',
  sort_by,
  period_id,
  active,
  status,
  ai_status,
}: Partial<EvaluationListParams> = {}) {
  const departmentId = useAuthStore((state) => state.user?.department_id) ?? undefined

  return useQuery({
    queryKey: [
      ...evaluationsKeys.lists(),
      {
        page,
        limit,
        search,
        sort_by,
        period_id,
        active,
        status,
        ai_status,
        department_id: departmentId,
      },
    ],
    queryFn: () =>
      getEvaluations({
        page,
        limit,
        search,
        sort_by,
        period_id,
        active,
        status,
        ai_status,
        department_id: departmentId,
      }),
    enabled: departmentId != null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Toggles whether an evaluation is active (`PATCH /evaluations/{id}/status`)
 * and invalidates the list so the table refreshes.
 *
 * @example
 * const { mutate: toggleStatus } = useUpdateEvaluationStatus();
 */
export function useUpdateEvaluationStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ evaluationId, active }: { evaluationId: number; active: boolean }) =>
      updateEvaluationStatus(evaluationId, { active }),
    onSuccess: (_data, { active }) => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.lists() })
      toast.success(
        active ? 'Evaluación activada exitosamente' : 'Evaluación desactivada exitosamente',
      )
    },
  })
}

/**
 * Deletes an evaluation (`DELETE /evaluations/{id}`) and invalidates the list.
 *
 * @example
 * const { mutate: removeEvaluation } = useDeleteEvaluation();
 */
export function useDeleteEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (evaluationId: number) => deleteEvaluation(evaluationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.lists() })
      toast.success('Evaluación eliminada exitosamente')
    },
  })
}

/**
 * Triggers the AI analysis of an evaluation (`POST /evaluations/{id}/analyze`)
 * and invalidates the list so the AI status column refreshes.
 *
 * @example
 * const { mutate: analyze } = useAnalyzeEvaluation();
 */
export function useAnalyzeEvaluation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (evaluationId: number) => analyzeEvaluation(evaluationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: evaluationsKeys.lists() })
      toast.success('Análisis con IA iniciado exitosamente')
    },
  })
}

/**
 * Uploads a teacher evaluation PDF (`POST /evaluations/upload`) as
 * multipart/form-data. Resolves with the created evaluation, whose id is used
 * to open the progress WebSocket channel.
 *
 * @example
 * const { mutate: upload, isPending } = useUploadEvaluation();
 * upload(file);
 */
export function useUploadEvaluation() {
  return useMutation({
    mutationFn: (file: File) => uploadEvaluation(file),
  })
}
