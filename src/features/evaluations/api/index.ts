import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type { CourseModality } from '@/features/stats'
import type { EvaluationDimensionsDetail, EvaluationRecord, EvaluationStatusUpdate } from '../types'

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

async function getEvaluationById(evaluationId: number): Promise<ResponseAPI<EvaluationRecord>> {
  return api.get(`/evaluations/${evaluationId}`)
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

async function uploadEvaluation(files: File[]): Promise<ResponseAPI<EvaluationRecord>> {
  const formData = new FormData()

  // Repeated `file` fields — the endpoint takes an array, one PDF per
  // modality, and reads the modality out of each document.
  for (const file of files) formData.append('file', file)

  return api.post('/evaluations/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

async function getEvaluationPdf(evaluationId: number, modality?: CourseModality): Promise<Blob> {
  return api.get(`/evaluations/${evaluationId}/pdf`, {
    params: { modality },
    responseType: 'blob',
  })
}

async function getTeacherEvaluationReport(teacherId: number, evaluationId: number): Promise<Blob> {
  return api.get(`/teachers/${teacherId}/evaluations/${evaluationId}/report`, {
    responseType: 'blob',
  })
}

interface EvaluationDimensionsDetailParams {
  teacherId?: number
  courseId?: number
}

async function getEvaluationDimensionsDetail(
  evaluationId: number,
  { teacherId, courseId }: EvaluationDimensionsDetailParams = {},
): Promise<ResponseAPI<EvaluationDimensionsDetail>> {
  const query: Record<string, unknown> = {}

  if (teacherId) query['teacher_id'] = teacherId
  if (courseId) query['course_id'] = courseId

  return api.get(`/evaluations/${evaluationId}/dimensions/detail`, { params: query })
}

/** How often an in-flight evaluation is re-checked while it processes. */
const EVALUATION_POLL_INTERVAL = 5_000

/** Query-key factory so list invalidations stay consistent. */
export const evaluationsKeys = {
  all: ['evaluations'] as const,
  lists: () => [...evaluationsKeys.all, 'list'] as const,
  detail: (periodId: number) => [...evaluationsKeys.all, 'detail', periodId] as const,
  byId: (evaluationId: number) => [...evaluationsKeys.all, 'byId', evaluationId] as const,
  pdf: (evaluationId: number, modality?: CourseModality) =>
    [...evaluationsKeys.all, 'pdf', evaluationId, modality] as const,
  teacherReport: (teacherId: number, evaluationId: number) =>
    [...evaluationsKeys.all, 'teacher-report', teacherId, evaluationId] as const,
  dimensionsDetail: (evaluationId: number, filters: EvaluationDimensionsDetailParams = {}) =>
    [...evaluationsKeys.all, 'dimensionsDetail', evaluationId, filters] as const,
}

/**
 * Downloads the source PDF of an evaluation as a `Blob`
 * (`GET /evaluations/{evaluation_id}/pdf`). An evaluation can carry one
 * document per modality; `modality` picks which one, and the backend falls
 * back to `PRESENCIAL` when it is omitted. The file is not a public asset:
 * the request carries the Bearer token and the backend only serves it to an
 * ADMIN or the DIRECTOR of the owning department, so a 403 is an expected
 * outcome — and so is a 404 for a modality this evaluation was never given.
 * Never retried — neither improves on a second try.
 *
 * @example
 * const { data: blob, isPending } = useGetEvaluationPdf(evaluationId, 'DISTANCIA');
 */
export function useGetEvaluationPdf(evaluationId?: number, modality?: CourseModality) {
  return useQuery({
    queryKey: evaluationsKeys.pdf(evaluationId ?? 0, modality),
    queryFn: () => getEvaluationPdf(evaluationId!, modality),
    enabled: evaluationId != null,
    retry: false,
    staleTime: 300_000,
    gcTime: 300_000,
  })
}

/**
 * Downloads a teacher's own report for an evaluation as a `Blob`
 * (`GET /teachers/{teacher_id}/evaluations/{evaluation_id}/report`) — the
 * source document split down to the part that belongs to that teacher, which
 * is what they may read of a PDF they can't see in full. Lives here, next to
 * `useGetEvaluationPdf`, despite the `/teachers/...` path: it feeds the same
 * document page, and keeping the pair together avoids a dependency from this
 * feature's hooks onto `teachers`. Never retried — neither 403 nor 404
 * improves on a second try.
 *
 * @example
 * const { data: blob } = useGetTeacherEvaluationReport({ teacherId, evaluationId });
 */
export function useGetTeacherEvaluationReport({
  teacherId,
  evaluationId,
}: {
  teacherId?: number
  evaluationId?: number
}) {
  return useQuery({
    queryKey: evaluationsKeys.teacherReport(teacherId ?? 0, evaluationId ?? 0),
    queryFn: () => getTeacherEvaluationReport(teacherId!, evaluationId!),
    enabled: teacherId != null && evaluationId != null,
    retry: false,
    staleTime: 300_000,
    gcTime: 300_000,
  })
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
 * Fetches a single evaluation by its own id (`GET /evaluations/{evaluation_id}`).
 * Prefer this over `useGetEvaluationByPeriod` when the id at hand is the
 * evaluation's — a period can only be resolved to one evaluation, so going
 * through the period is an extra indirection that breaks as soon as a period
 * holds more than one.
 *
 * Polls itself every 5s while the evaluation is still `PROCESSING`, so a page
 * opened right after the upload lands on the finished record on its own. The
 * progress WebSocket is the fast path; this is the fallback for when it never
 * connects.
 *
 * @example
 * const { data, isLoading } = useGetEvaluation(evaluationId);
 */
export function useGetEvaluation(evaluationId?: number) {
  return useQuery({
    queryKey: evaluationsKeys.byId(evaluationId ?? 0),
    queryFn: () => getEvaluationById(evaluationId!),
    enabled: evaluationId != null,
    staleTime: 60_000,
    refetchInterval: (query) =>
      query.state.data?.data?.status === 'PROCESSING' ? EVALUATION_POLL_INTERVAL : false,
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
 * Fetches the per-dimension breakdown of an evaluation — each dimension's
 * questions, every teacher's average, and the best/worst performer
 * (`GET /evaluations/{evaluation_id}/dimensions/detail`). Optionally scoped
 * to one teacher and/or one course.
 *
 * @example
 * const { data, isLoading } = useGetEvaluationDimensionsDetail(evaluationId);
 *
 * @example
 * const { data } = useGetEvaluationDimensionsDetail(evaluationId, { teacherId, courseId });
 */
export function useGetEvaluationDimensionsDetail(
  evaluationId?: number,
  { teacherId, courseId }: EvaluationDimensionsDetailParams = {},
) {
  return useQuery({
    queryKey: evaluationsKeys.dimensionsDetail(evaluationId ?? 0, { teacherId, courseId }),
    queryFn: () => getEvaluationDimensionsDetail(evaluationId!, { teacherId, courseId }),
    enabled: evaluationId != null,
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
 * Uploads the teacher evaluation PDFs of one period (`POST /evaluations/upload`)
 * as multipart/form-data — one document, or one per modality (presencial and
 * distancia), which the backend merges into a single evaluation. Resolves with
 * the created evaluation, whose id is used to open the progress WebSocket
 * channel.
 *
 * @example
 * const { mutate: upload, isPending } = useUploadEvaluation();
 * upload([presencial, distancia]);
 */
export function useUploadEvaluation() {
  return useMutation({
    mutationFn: (files: File[]) => uploadEvaluation(files),
  })
}
