import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type { CourseModality } from '@/lib/modality'
import type {
  CourseHistoryOut,
  TeacherComment,
  TeacherCommentsData,
  TeacherDetail,
  TeacherMatrix,
  TeacherRecord,
  TeacherUploadData,
} from '../types'

interface TeacherListParams {
  page: number
  limit: number
  academic_period_id: number
  search?: string
  department_id?: number
  active?: boolean
  contract_type?: string
  sort_by?: string
  has_average?: boolean
  modality?: CourseModality
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
  if (params.active !== undefined) query['active'] = params.active
  if (params.contract_type) query['contract_type'] = params.contract_type
  if (params.sort_by) query['sort_by'] = params.sort_by
  if (params.has_average !== undefined) query['has_average'] = params.has_average
  if (params.modality) query['modality'] = params.modality

  return api.get('/teachers/with-averages', { params: query })
}

async function getTeachers(params: {
  page: number
  limit: number
  department_id?: number | null
}): Promise<ResponseAPI<TeacherRecord[]>> {
  return api.get('/teachers/', { params })
}

async function getTeacherDetail(
  teacherId: number,
  periodName: string,
): Promise<ResponseAPI<TeacherDetail>> {
  return api.get(`/evaluations/teachers/${teacherId}/detail`, {
    params: { period_name: periodName, compare_previous: true },
  })
}

async function getTeacherComments(
  evaluationId: number,
  teacherId: number,
): Promise<ResponseAPI<TeacherCommentsData>> {
  return api.get(`/evaluations/${evaluationId}/teachers/${teacherId}/comments`)
}

async function getTeacherCourseHistory(
  teacherId: number,
  courseCode: string,
  params: { limit?: number },
): Promise<ResponseAPI<CourseHistoryOut>> {
  return api.get(`/teachers/${teacherId}/courses/${encodeURIComponent(courseCode)}/history`, {
    params,
  })
}

async function getTeacherMatrix(
  teacherId: number,
  evaluationId: number,
): Promise<ResponseAPI<TeacherMatrix>> {
  return api.get(`/stats/teachers/${teacherId}/matrix`, {
    params: { evaluation_id: evaluationId },
  })
}

async function uploadTeachers(file: File): Promise<ResponseAPI<TeacherUploadData>> {
  const formData = new FormData()
  formData.append('file', file)

  return api.post('/teachers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

interface CreateTeacherWithUserPayload {
  email: string
  name: string
  institutional_code: string
  department_id: number
  contract_type: string
  active: boolean
}

interface UpdateTeacherPayload {
  name?: string
  email?: string
  avatar_url?: string
  institutional_code: string
  department_id: number
  contract_type: string
  user_id: number
  active: boolean
}

async function createTeacherWithUser(
  payload: CreateTeacherWithUserPayload,
): Promise<ResponseAPI<TeacherRecord>> {
  return api.post('/teachers/with-user', payload)
}

async function updateTeacher(
  teacherId: number,
  payload: UpdateTeacherPayload,
): Promise<ResponseAPI<TeacherRecord>> {
  return api.put(`/teachers/${teacherId}`, payload)
}

interface UpdateCommentPayload {
  risk_level: number
  pedagogical_category_ids: number[]
}

async function updateComment(
  commentId: number,
  payload: UpdateCommentPayload,
): Promise<ResponseAPI<TeacherComment>> {
  return api.patch(`/comments/${commentId}`, payload)
}

async function getTeacherEvaluationReportBlob(
  teacherId: number,
  evaluationId: number,
): Promise<Blob> {
  return api.get(`/teachers/${teacherId}/evaluations/${evaluationId}/report`, {
    responseType: 'blob',
  }) as unknown as Promise<Blob>
}

/** Query-key factory so list invalidations stay consistent. */
export const teachersKeys = {
  all: ['teachers'] as const,
  lists: () => [...teachersKeys.all, 'list'] as const,
  detail: (teacherId: number, periodName: string) =>
    [...teachersKeys.all, 'detail', teacherId, periodName] as const,
  comments: (evaluationId: number, teacherId: number) =>
    [...teachersKeys.all, 'comments', evaluationId, teacherId] as const,
  courseHistory: (teacherId: number, courseCode: string, limit?: number) =>
    [...teachersKeys.all, 'course-history', teacherId, courseCode, limit] as const,
  matrix: (teacherId: number, evaluationId: number) =>
    [...teachersKeys.all, 'matrix', teacherId, evaluationId] as const,
}

/**
 * Fetches the paginated list of teachers with their averages for an academic
 * period (`GET /teachers/with-averages`). By default the department id is
 * read from the authenticated director's store so results stay scoped to
 * their own department; pass `departmentId` explicitly to override that
 * (e.g. an admin browsing a chosen department) or `departmentId: null` to
 * span every department the caller is allowed to see.
 *
 * @example
 * const { data, isPending } = useGetTeachers({ page, limit, academicPeriodId: 1, search });
 *
 * @example
 * // Admin widget: no department scoping, caller picks the department instead.
 * const { data } = useGetTeachers({ academicPeriodId, departmentId: selectedDepartmentId });
 */
export function useGetTeachers({
  page = 1,
  limit = 10,
  academicPeriodId,
  departmentId,
  search = '',
  active,
  contractType,
  sortBy,
  hasAverage,
  modality,
}: {
  page?: number
  limit?: number
  academicPeriodId?: number
  /** Overrides the department read from the auth store. Pass `null` to omit the filter entirely. */
  departmentId?: number | null
  search?: string
  active?: boolean
  contractType?: string
  sortBy?: string
  hasAverage?: boolean
  /** Narrows the averages to the groups taught in one modality. */
  modality?: CourseModality
}) {
  const authDepartmentId = useAuthStore((state) => state.user?.department_id) ?? undefined
  const resolvedDepartmentId =
    (departmentId === undefined ? authDepartmentId : departmentId) ?? undefined
  const departmentResolved = departmentId !== undefined || authDepartmentId != null

  const params: TeacherListParams | null =
    academicPeriodId != null && departmentResolved
      ? {
          page,
          limit,
          academic_period_id: academicPeriodId,
          search,
          department_id: resolvedDepartmentId,
          active,
          contract_type: contractType,
          sort_by: sortBy,
          has_average: hasAverage,
          modality,
        }
      : null

  return useQuery({
    queryKey: [
      ...teachersKeys.lists(),
      {
        page,
        limit,
        academicPeriodId,
        search,
        department_id: resolvedDepartmentId,
        active,
        contractType,
        sortBy,
        hasAverage,
        modality,
      },
    ],
    queryFn: () => getTeachersWithAverages(params!),
    enabled: params !== null,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Fetches the plain paginated list of teachers, with no period/average
 * attached (`GET /teachers/`) — e.g. to populate a teacher picker. By
 * default the department id is read from the authenticated director's
 * store; pass `departmentId` explicitly to override it, or `null` to span
 * every department. Stays disabled (no request sent) for a director with no
 * department and no explicit override — `GET /teachers/` accepts
 * `department_id` as a plain query param rather than deriving it from the
 * caller's session, so an unscoped request here would return every
 * department's teachers.
 *
 * @example
 * const { data, isPending } = useListTeachers({ page: 1, limit: 50 });
 */
export function useListTeachers({
  page = 1,
  limit = 10,
  departmentId,
}: {
  page?: number
  limit?: number
  /** Overrides the department read from the auth store. Pass `null` to omit the filter entirely. */
  departmentId?: number | null
} = {}) {
  const authDepartmentId = useAuthStore((state) => state.user?.department_id) ?? undefined
  const resolvedDepartmentId = departmentId === undefined ? authDepartmentId : departmentId
  const departmentResolved = departmentId !== undefined || authDepartmentId != null

  return useQuery({
    queryKey: [
      ...teachersKeys.lists(),
      'plain',
      { page, limit, department_id: resolvedDepartmentId },
    ],
    queryFn: () => getTeachers({ page, limit, department_id: resolvedDepartmentId }),
    enabled: departmentResolved,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Fetches the full detail of a teacher for a specific academic period
 * (`GET /evaluations/teachers/{id}/detail`).
 *
 * @example
 * const { data, isLoading } = useGetTeacherDetail({ teacherId: 1, periodName: '2024-I' });
 */
export function useGetTeacherDetail({
  teacherId,
  periodName,
}: {
  teacherId?: number
  periodName?: string
}) {
  return useQuery({
    queryKey: teachersKeys.detail(teacherId ?? 0, periodName ?? ''),
    queryFn: () => getTeacherDetail(teacherId!, periodName!),
    enabled: teacherId != null && periodName != null && periodName !== '',
    staleTime: 60_000,
  })
}

/**
 * Fetches the student comments of a teacher for an evaluation, grouped by
 * course/group (`GET /evaluations/{evaluation_id}/teachers/{teacher_id}/comments`).
 * Stays disabled until both ids are known.
 *
 * @example
 * const { data, isPending } = useGetTeacherComments({ evaluationId: 3, teacherId: 12 });
 */
export function useGetTeacherComments({
  evaluationId,
  teacherId,
}: {
  evaluationId?: number
  teacherId?: number
}) {
  return useQuery({
    queryKey: teachersKeys.comments(evaluationId ?? 0, teacherId ?? 0),
    queryFn: () => getTeacherComments(evaluationId!, teacherId!),
    enabled: evaluationId != null && teacherId != null,
    staleTime: 60_000,
  })
}

/**
 * Fetches a teacher's per-period score history for one specific course
 * (`GET /teachers/{teacher_id}/courses/{course_code}/history`), most recent
 * period first — includes the department average and full dimension
 * breakdown per period, so a screen can let the user compare against any
 * period the course was taught, not just the immediately previous one.
 * Works for any teacher id — used both by the teacher's own view and a
 * director's read of that teacher.
 *
 * @example
 * const { data } = useGetTeacherCourseHistory({ teacherId: 12, courseCode: 'SIS101', limit: 12 });
 */
export function useGetTeacherCourseHistory({
  teacherId,
  courseCode,
  limit,
}: {
  teacherId?: number
  courseCode?: string
  limit?: number
}) {
  return useQuery({
    queryKey: teachersKeys.courseHistory(teacherId ?? 0, courseCode ?? '', limit),
    queryFn: () => getTeacherCourseHistory(teacherId!, courseCode!, { limit }),
    enabled: teacherId != null && teacherId > 0 && Boolean(courseCode),
    staleTime: 60_000,
  })
}

/**
 * Fetches a teacher's per-course, per-question average matrix for one
 * evaluation (`GET /stats/teachers/{teacher_id}/matrix`) — one row per
 * question, one column per course the teacher taught that period, plus the
 * per-question average across all their courses. Lives here (not `stats/api`)
 * despite the `/stats/...` path: it's single-teacher data, not a cross-teacher
 * aggregate, and `stats` already imports types from `teachers`, so a hook
 * here avoids a circular feature dependency.
 *
 * @example
 * const { data } = useGetTeacherMatrix({ teacherId: 12, evaluationId: 5 });
 */
export function useGetTeacherMatrix({
  teacherId,
  evaluationId,
}: {
  teacherId?: number
  evaluationId?: number
}) {
  return useQuery({
    queryKey: teachersKeys.matrix(teacherId ?? 0, evaluationId ?? 0),
    queryFn: () => getTeacherMatrix(teacherId!, evaluationId!),
    enabled: teacherId != null && evaluationId != null,
    staleTime: 60_000,
  })
}

/**
 * Uploads a CSV/XLSX file with teacher records (`POST /teachers/upload`) as
 * multipart/form-data. Resolves with the created, skipped and error entries.
 *
 * @example
 * const { mutate: upload, isPending } = useUploadTeachers();
 * upload(file);
 */
export function useUploadTeachers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadTeachers(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teachersKeys.lists() })
    },
  })
}

/**
 * Creates a new teacher with an associated user account (`POST /teachers/with-user`).
 * Invalidates the teachers list on success.
 *
 * @example
 * const { mutate: createTeacher, isPending } = useCreateTeacherWithUser();
 * createTeacher({ email, name, institutional_code, department_id, contract_type, active: true });
 */
export function useCreateTeacherWithUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: CreateTeacherWithUserPayload) => createTeacherWithUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teachersKeys.lists() })
    },
  })
}

/**
 * Updates an existing teacher (`PUT /teachers/{id}`). Invalidates the
 * teachers list on success.
 *
 * @example
 * const { mutate: updateTeacher, isPending } = useUpdateTeacher();
 * updateTeacher({ teacherId: 1, payload: { institutional_code, department_id, contract_type, user_id, active } });
 */
export function useUpdateTeacher() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ teacherId, payload }: { teacherId: number; payload: UpdateTeacherPayload }) =>
      updateTeacher(teacherId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teachersKeys.lists() })
    },
  })
}

/**
 * Overrides the risk level and/or pedagogical category the AI assigned to a
 * comment (`PATCH /comments/{comment_id}`) — a director's manual correction.
 * Invalidates the comments list the updated comment belongs to.
 *
 * @example
 * const { mutate: updateComment, isPending } = useUpdateComment();
 * updateComment({ commentId: comment.id, payload: { risk_level: 2, pedagogical_category_ids: [1, 3] } });
 */
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, payload }: { commentId: number; payload: UpdateCommentPayload }) =>
      updateComment(commentId, payload),
    onSuccess: () => {
      // Also matches the flat `/comments/` list (features/comments) — both key
      // families include 'comments', so one predicate invalidates each cache
      // this edit could be visible in without a cross-feature import.
      queryClient.invalidateQueries({
        predicate: (query) => query.queryKey.includes('comments'),
      })
    },
  })
}

/**
 * Fetches a teacher's evaluation report PDF for one period
 * (`GET /teachers/{teacher_id}/evaluations/{evaluation_id}/report`) and
 * resolves to an object URL ready to open — an imperative action, not
 * cached data, so it's a mutation rather than a query. The backend enforces
 * who can see which report (a teacher only their own, a director only their
 * department); on a 403/404 the caller gets the rejected `ApiError` to show
 * a precise message.
 *
 * @example
 * const downloadReport = useDownloadTeacherEvaluationReport()
 * downloadReport.mutate(
 *   { teacherId, evaluationId },
 *   { onSuccess: (url) => window.open(url, '_blank') },
 * )
 */
export function useDownloadTeacherEvaluationReport() {
  return useMutation({
    mutationFn: async ({
      teacherId,
      evaluationId,
    }: {
      teacherId: number
      evaluationId: number
    }) => {
      const blob = await getTeacherEvaluationReportBlob(teacherId, evaluationId)

      return URL.createObjectURL(blob)
    },
  })
}
