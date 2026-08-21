import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type {
  CaseReportInput,
  CheckpointInput,
  ClosePlanInput,
  CreatePlanInput,
  EvidenceRequestInput,
  EvidenceReviewInput,
  Plan,
  PlanCandidate,
  PlanEvidence,
  PlanEvidenceComment,
  PlanEvidenceRequest,
  PlanFormatSlug,
  PlanIndicators,
  PlanPeriod,
  TeacherCourseOption,
  TeacherPlanHistory,
  UpdatePlanInput,
} from '../types'

/** Raw request functions. Not exported — call through the hooks below. */

async function getPlans(params: {
  page: number
  limit: number
  department_id?: number
  period_id?: number
  status?: string
  search?: string
  teacher_id?: number
}): Promise<ResponseAPI<Plan[]>> {
  return api.get('/improvement-plans/', { params })
}

async function getPlan(planId: number): Promise<ResponseAPI<Plan>> {
  return api.get(`/improvement-plans/${planId}`)
}

async function getMyPlans(): Promise<ResponseAPI<Plan[]>> {
  return api.get('/improvement-plans/my')
}

async function getPlanCandidates(params: {
  period_id: number
  department_id?: number
}): Promise<ResponseAPI<PlanCandidate[]>> {
  return api.get('/improvement-plans/candidates', { params })
}

async function getPlanPeriods(departmentId?: number): Promise<ResponseAPI<PlanPeriod[]>> {
  return api.get('/improvement-plans/periods', {
    params: departmentId ? { department_id: departmentId } : undefined,
  })
}

async function getPlanIndicators(): Promise<ResponseAPI<PlanIndicators>> {
  return api.get('/improvement-plans/indicators')
}

async function getTeacherCourses(
  teacherId: number,
  periodId: number,
): Promise<ResponseAPI<TeacherCourseOption[]>> {
  return api.get(`/improvement-plans/teacher/${teacherId}/courses`, {
    params: { period_id: periodId },
  })
}

async function getTeacherPlanHistory(teacherId: number): Promise<ResponseAPI<TeacherPlanHistory>> {
  return api.get(`/improvement-plans/teacher/${teacherId}/history`)
}

async function createPlan(payload: CreatePlanInput): Promise<ResponseAPI<Plan>> {
  return api.post('/improvement-plans/', payload)
}

async function updatePlan(planId: number, payload: UpdatePlanInput): Promise<ResponseAPI<Plan>> {
  return api.put(`/improvement-plans/${planId}`, payload)
}

async function deletePlan(planId: number): Promise<void> {
  return api.delete(`/improvement-plans/${planId}`)
}

async function upsertCaseReport(
  planId: number,
  payload: CaseReportInput,
): Promise<ResponseAPI<Plan>> {
  return api.put(`/improvement-plans/${planId}/case-report`, payload)
}

async function updateCheckpoint(
  planId: number,
  checkpointId: number,
  payload: CheckpointInput,
): Promise<ResponseAPI<Plan>> {
  return api.put(`/improvement-plans/${planId}/checkpoints/${checkpointId}`, payload)
}

async function closeActa(planId: number): Promise<ResponseAPI<Plan>> {
  return api.post(`/improvement-plans/${planId}/acta/close`)
}

async function reopenActa(planId: number): Promise<ResponseAPI<Plan>> {
  return api.post(`/improvement-plans/${planId}/acta/reopen`)
}

async function closePlan(planId: number, payload: ClosePlanInput): Promise<ResponseAPI<Plan>> {
  return api.post(`/improvement-plans/${planId}/close`, payload)
}

async function uploadSignedDocument(
  planId: number,
  format: PlanFormatSlug,
  file: File,
): Promise<ResponseAPI<Plan>> {
  const formData = new FormData()
  formData.append('file', file)

  return api.post(`/improvement-plans/${planId}/documents/${format}/signed`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

async function getEvidenceRequests(planId: number): Promise<ResponseAPI<PlanEvidenceRequest[]>> {
  return api.get(`/improvement-plans/${planId}/evidence-requests`)
}

async function createEvidenceRequest(
  planId: number,
  payload: EvidenceRequestInput,
): Promise<ResponseAPI<PlanEvidenceRequest>> {
  return api.post(`/improvement-plans/${planId}/evidence-requests`, payload)
}

async function addEvidenceComment(
  planId: number,
  requestId: number,
  body: string,
): Promise<ResponseAPI<PlanEvidenceComment>> {
  return api.post(`/improvement-plans/${planId}/evidence-requests/${requestId}/comments`, {
    body,
  })
}

async function uploadEvidence(
  planId: number,
  payload: { file: File; description?: string; itemId?: number; requestId?: number },
): Promise<ResponseAPI<PlanEvidence>> {
  const formData = new FormData()
  formData.append('file', payload.file)
  if (payload.description) formData.append('description', payload.description)
  if (payload.itemId != null) formData.append('item_id', String(payload.itemId))
  if (payload.requestId != null) formData.append('request_id', String(payload.requestId))

  return api.post(`/improvement-plans/${planId}/evidences`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

async function reviewEvidence(
  planId: number,
  evidenceId: number,
  payload: EvidenceReviewInput,
): Promise<ResponseAPI<PlanEvidence>> {
  return api.put(`/improvement-plans/${planId}/evidences/${evidenceId}/review`, payload)
}

async function deleteEvidence(planId: number, evidenceId: number): Promise<void> {
  return api.delete(`/improvement-plans/${planId}/evidences/${evidenceId}`)
}

async function deleteSignedDocument(
  planId: number,
  format: PlanFormatSlug,
): Promise<ResponseAPI<Plan>> {
  return api.delete(`/improvement-plans/${planId}/documents/${format}/signed`)
}

/**
 * Plan files sit behind the Bearer token, so they can't be linked to directly:
 * they are fetched as a `Blob` and handed to the browser as an object URL.
 *
 * `generated` asks for the form as the system renders it; without it the API
 * answers with the signed scan whenever there is one.
 */
async function getDocumentBlob(
  planId: number,
  format: PlanFormatSlug,
  generated = false,
): Promise<Blob> {
  return api.get(`/improvement-plans/${planId}/documents/${format}`, {
    responseType: 'blob',
    params: generated ? { generated: true } : undefined,
  }) as unknown as Promise<Blob>
}

/**
 * Editable Word copy of a form. Rendered on the fly from the plan as it stands,
 * so — unlike the PDF — it doesn't need the document to have been generated.
 */
async function getDocumentWordBlob(planId: number, format: PlanFormatSlug): Promise<Blob> {
  return api.get(`/improvement-plans/${planId}/documents/${format}/word`, {
    responseType: 'blob',
  }) as unknown as Promise<Blob>
}

async function getEvidenceBlob(planId: number, evidenceId: number): Promise<Blob> {
  return api.get(`/improvement-plans/${planId}/evidences/${evidenceId}`, {
    responseType: 'blob',
  }) as unknown as Promise<Blob>
}

/** Downloads a protected plan file, prompting the browser's save dialog. */
async function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

/** Query-key factory so list invalidations stay consistent. */
export const plansKeys = {
  all: ['plans'] as const,
  lists: () => [...plansKeys.all, 'list'] as const,
  detail: (planId: number) => [...plansKeys.all, 'detail', planId] as const,
  mine: () => [...plansKeys.all, 'mine'] as const,
  candidates: (periodId?: number) => [...plansKeys.all, 'candidates', periodId] as const,
  periods: () => [...plansKeys.all, 'periods'] as const,
  indicators: () => [...plansKeys.all, 'indicators'] as const,
  courses: (teacherId?: number, periodId?: number) =>
    [...plansKeys.all, 'courses', teacherId, periodId] as const,
  history: (teacherId: number) => [...plansKeys.all, 'history', teacherId] as const,
  evidenceRequests: (planId: number) => [...plansKeys.all, 'evidence-requests', planId] as const,
}

/**
 * Paginated list of improvement plans. Scoped to the director's own department
 * unless an explicit `departmentId` is given (an admin browsing).
 *
 * @example
 * const { data, isPending } = useGetPlans({ page, limit, status: 'EN_SEGUIMIENTO' })
 */
export function useGetPlans({
  page = 1,
  limit = 10,
  departmentId,
  periodId,
  status,
  search,
  teacherId,
  enabled = true,
}: {
  page?: number
  limit?: number
  departmentId?: number | null
  periodId?: number
  status?: string
  search?: string
  teacherId?: number
  /** Held back while the caller resolves a filter, to avoid a throwaway fetch. */
  enabled?: boolean
} = {}) {
  const authDepartmentId = useAuthStore((state) => state.user?.department_id) ?? undefined
  const resolved = (departmentId === undefined ? authDepartmentId : departmentId) ?? undefined

  return useQuery({
    queryKey: [
      ...plansKeys.lists(),
      { page, limit, resolved, periodId, status, search, teacherId },
    ],
    queryFn: () =>
      getPlans({
        page,
        limit,
        department_id: resolved,
        period_id: periodId,
        status: status || undefined,
        search: search || undefined,
        teacher_id: teacherId,
      }),
    enabled,
  })
}

/** Full detail of one plan, including items, courses, follow-ups and documents. */
export function useGetPlan(planId?: number) {
  return useQuery({
    queryKey: plansKeys.detail(planId ?? 0),
    queryFn: () => getPlan(planId as number),
    enabled: planId != null,
  })
}

/** Plans of the signed-in teacher. */
export function useGetMyPlans() {
  return useQuery({ queryKey: plansKeys.mine(), queryFn: getMyPlans })
}

/**
 * Every evaluated teacher of the department with their per-indicator averages.
 * The list is deliberately complete — the weak ones are only highlighted, since
 * the director is the one who decides who gets a plan.
 */
export function useGetPlanCandidates(periodId?: number, departmentId?: number) {
  return useQuery({
    queryKey: plansKeys.candidates(periodId),
    queryFn: () =>
      getPlanCandidates({ period_id: periodId as number, department_id: departmentId }),
    enabled: periodId != null,
  })
}

/** Academic periods with evaluations loaded, selectable as the plan origin. */
export function useGetPlanPeriods(departmentId?: number) {
  return useQuery({
    queryKey: [...plansKeys.periods(), departmentId],
    queryFn: () => getPlanPeriods(departmentId),
  })
}

/** Catalogue of indicators and the five aspects of the official forms. */
export function useGetPlanIndicators() {
  return useQuery({ queryKey: plansKeys.indicators(), queryFn: getPlanIndicators })
}

/** Asignaturas the teacher taught in a period, to prefill the forms. */
export function useGetTeacherCourses(teacherId?: number, periodId?: number) {
  return useQuery({
    queryKey: plansKeys.courses(teacherId, periodId),
    queryFn: () => getTeacherCourses(teacherId as number, periodId as number),
    enabled: teacherId != null && periodId != null,
  })
}

/** Cross-period history of a teacher, including plan recurrences. */
export function useGetTeacherPlanHistory(teacherId?: number) {
  return useQuery({
    queryKey: plansKeys.history(teacherId ?? 0),
    queryFn: () => getTeacherPlanHistory(teacherId as number),
    enabled: teacherId != null,
  })
}

/** Deliverables requested on a plan, with their submissions and threads. */
export function useGetEvidenceRequests(planId?: number) {
  return useQuery({
    queryKey: plansKeys.evidenceRequests(planId ?? 0),
    queryFn: () => getEvidenceRequests(planId as number),
    enabled: planId != null,
  })
}

/**
 * Invalidates everything that can change when a plan is mutated.
 *
 * The returned promise is handed back from `onSuccess` on purpose: TanStack
 * awaits it, so `isPending` stays true until the refetched data is on screen.
 * That keeps a dialog open — with its button spinning — instead of closing it
 * over stale content that silently changes a second later.
 */
function usePlanInvalidation(planId?: number) {
  const queryClient = useQueryClient()

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() }),
      ...(planId != null
        ? [
            queryClient.invalidateQueries({ queryKey: plansKeys.detail(planId) }),
            queryClient.invalidateQueries({
              queryKey: plansKeys.evidenceRequests(planId),
            }),
          ]
        : []),
    ])
}

/**
 * Same, for the mutations that answer with the whole updated plan: its own
 * answer is written into the cache first, so the screen changes at once and the
 * refetch only confirms it.
 */
function usePlanRefresh(planId: number) {
  const queryClient = useQueryClient()
  const invalidate = usePlanInvalidation(planId)

  return (response: ResponseAPI<Plan>) => {
    if (response?.data) {
      queryClient.setQueryData(plansKeys.detail(planId), response)
    }

    return invalidate()
  }
}

export function useCreatePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreatePlanInput) => createPlan(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: plansKeys.lists() })
      queryClient.invalidateQueries({ queryKey: plansKeys.all })
    },
  })
}

export function useUpdatePlan(planId: number) {
  const refresh = usePlanRefresh(planId)

  return useMutation({
    mutationFn: (payload: UpdatePlanInput) => updatePlan(planId, payload),
    onSuccess: refresh,
  })
}

/**
 * Removes a plan for good, with everything hanging off it. Only the director of
 * its department may: the API turns anyone else away.
 *
 * The plan is gone, so its detail cache goes with it instead of being
 * refetched — a refetch would only 404 and paint an error over a page the
 * caller is already navigating away from.
 *
 * @example
 * const remove = useDeletePlan()
 * remove.mutate(plan.id, { onSuccess: () => navigate('/planes') })
 */
export function useDeletePlan() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (planId: number) => deletePlan(planId),
    onSuccess: async (_data, planId) => {
      queryClient.removeQueries({ queryKey: plansKeys.detail(planId) })
      queryClient.removeQueries({ queryKey: plansKeys.evidenceRequests(planId) })

      await queryClient.invalidateQueries({ queryKey: plansKeys.lists() })
      await queryClient.invalidateQueries({ queryKey: plansKeys.mine() })
    },
  })
}

export function useUpsertCaseReport(planId: number) {
  const refresh = usePlanRefresh(planId)

  return useMutation({
    mutationFn: (payload: CaseReportInput) => upsertCaseReport(planId, payload),
    onSuccess: refresh,
  })
}

export function useUpdateCheckpoint(planId: number) {
  const refresh = usePlanRefresh(planId)

  return useMutation({
    mutationFn: ({ checkpointId, payload }: { checkpointId: number; payload: CheckpointInput }) =>
      updateCheckpoint(planId, checkpointId, payload),
    onSuccess: refresh,
  })
}

export function useCloseActa(planId: number) {
  const refresh = usePlanRefresh(planId)

  return useMutation({ mutationFn: () => closeActa(planId), onSuccess: refresh })
}

export function useReopenActa(planId: number) {
  const refresh = usePlanRefresh(planId)

  return useMutation({ mutationFn: () => reopenActa(planId), onSuccess: refresh })
}

export function useClosePlan(planId: number) {
  const refresh = usePlanRefresh(planId)

  return useMutation({
    mutationFn: (payload: ClosePlanInput) => closePlan(planId, payload),
    onSuccess: refresh,
  })
}

export function useUploadSignedDocument(planId: number) {
  const refresh = usePlanRefresh(planId)

  return useMutation({
    mutationFn: ({ format, file }: { format: PlanFormatSlug; file: File }) =>
      uploadSignedDocument(planId, format, file),
    onSuccess: refresh,
  })
}

/**
 * Detaches a signed scan attached by mistake. The generated form stays in
 * place, so the row simply goes back to asking for a signature.
 */
/**
 * Attaches a signed scan to a plan whose id is only known at call time — the
 * Formato 1 picked while creating a plan, which can't be filed until the plan
 * it belongs to exists.
 *
 * @example
 * await uploadDocument.mutateAsync({ planId: created.id, format: 'formato-1', file })
 */
export function useUploadPlanDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      planId,
      format,
      file,
    }: {
      planId: number
      format: PlanFormatSlug
      file: File
    }) => uploadSignedDocument(planId, format, file),
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({ queryKey: plansKeys.detail(variables.planId) }),
  })
}

export function useDeleteSignedDocument(planId: number) {
  const refresh = usePlanRefresh(planId)

  return useMutation({
    mutationFn: (format: PlanFormatSlug) => deleteSignedDocument(planId, format),
    onSuccess: refresh,
  })
}

export function useCreateEvidenceRequest(planId: number) {
  const invalidate = usePlanInvalidation(planId)

  return useMutation({
    mutationFn: (payload: EvidenceRequestInput) => createEvidenceRequest(planId, payload),
    onSuccess: invalidate,
  })
}

export function useAddEvidenceComment(planId: number) {
  const invalidate = usePlanInvalidation(planId)

  return useMutation({
    mutationFn: ({ requestId, body }: { requestId: number; body: string }) =>
      addEvidenceComment(planId, requestId, body),
    onSuccess: invalidate,
  })
}

export function useUploadEvidence(planId: number) {
  const invalidate = usePlanInvalidation(planId)

  return useMutation({
    mutationFn: (payload: {
      file: File
      description?: string
      itemId?: number
      requestId?: number
    }) => uploadEvidence(planId, payload),
    onSuccess: invalidate,
  })
}

export function useReviewEvidence(planId: number) {
  const invalidate = usePlanInvalidation(planId)

  return useMutation({
    mutationFn: ({ evidenceId, payload }: { evidenceId: number; payload: EvidenceReviewInput }) =>
      reviewEvidence(planId, evidenceId, payload),
    onSuccess: invalidate,
  })
}

export function useDeleteEvidence(planId: number) {
  const invalidate = usePlanInvalidation(planId)

  return useMutation({
    mutationFn: (evidenceId: number) => deleteEvidence(planId, evidenceId),
    onSuccess: invalidate,
  })
}

/**
 * Downloads one of the official forms as the system renders it — the copy the
 * director prints to collect the signatures. The file is behind the Bearer
 * token, so it is fetched as a blob and saved from memory instead of linked to.
 * The API renders it on the spot when it was never generated.
 *
 * @example
 * const download = useDownloadDocument(plan.id)
 * download.mutate('formato-2')
 */
export function useDownloadDocument(planId: number) {
  return useMutation({
    mutationFn: async (format: PlanFormatSlug) => {
      const blob = await getDocumentBlob(planId, format, true)

      await saveBlob(blob, `${format}_plan_${planId}.pdf`)
    },
  })
}

/** The signed scan itself, saved under the name it was uploaded with. */
export function useDownloadSignedDocument(planId: number) {
  return useMutation({
    mutationFn: async ({ format, filename }: { format: PlanFormatSlug; filename: string }) => {
      const blob = await getDocumentBlob(planId, format)

      await saveBlob(blob, filename)
    },
  })
}

/**
 * Object URL of the signed scan, for previewing it in a new tab. The caller
 * owns the URL: it opens the tab and revokes it afterwards.
 */
export function usePreviewSignedDocument(planId: number) {
  return useMutation({
    mutationFn: async (format: PlanFormatSlug) => {
      const blob = await getDocumentBlob(planId, format)

      return URL.createObjectURL(blob)
    },
  })
}

/**
 * Downloads the editable Word copy of a form, for the corrections the director
 * makes before printing it for signature.
 *
 * @example
 * const downloadWord = useDownloadDocumentWord(plan.id)
 * downloadWord.mutate('formato-2')
 */
export function useDownloadDocumentWord(planId: number) {
  return useMutation({
    mutationFn: async (format: PlanFormatSlug) => {
      const blob = await getDocumentWordBlob(planId, format)

      await saveBlob(blob, `${format}_plan_${planId}.doc`)
    },
  })
}

/**
 * Same idea for a submitted evidence file: saved under the name it was uploaded
 * with, which the caller resolves with `evidenceFileName`.
 */
export function useDownloadEvidence(planId: number) {
  return useMutation({
    mutationFn: async ({ evidenceId, filename }: { evidenceId: number; filename: string }) => {
      const blob = await getEvidenceBlob(planId, evidenceId)

      await saveBlob(blob, filename)
    },
  })
}

/**
 * Object URL of a submitted evidence, for previewing it in a new tab. As with
 * the signed forms, the caller owns the URL: it opens the tab and revokes it.
 */
export function usePreviewEvidence(planId: number) {
  return useMutation({
    mutationFn: async (evidenceId: number) => {
      const blob = await getEvidenceBlob(planId, evidenceId)

      return URL.createObjectURL(blob)
    },
  })
}
