import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type {
  TeacherComment,
  TeacherCommentsData,
  TeacherDetail,
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

  return api.get('/teachers/with-averages', { params: query })
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
  pedagogical_category_id: number
}

async function updateComment(
  commentId: number,
  payload: UpdateCommentPayload,
): Promise<ResponseAPI<TeacherComment>> {
  return api.patch(`/comments/${commentId}`, payload)
}

/** Query-key factory so list invalidations stay consistent. */
export const teachersKeys = {
  all: ['teachers'] as const,
  lists: () => [...teachersKeys.all, 'list'] as const,
  detail: (teacherId: number, periodName: string) =>
    [...teachersKeys.all, 'detail', teacherId, periodName] as const,
  comments: (evaluationId: number, teacherId: number) =>
    [...teachersKeys.all, 'comments', evaluationId, teacherId] as const,
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
  active,
  contractType,
  sortBy,
  hasAverage,
}: {
  page?: number
  limit?: number
  academicPeriodId?: number
  search?: string
  active?: boolean
  contractType?: string
  sortBy?: string
  hasAverage?: boolean
}) {
  const departmentId = useAuthStore((state) => state.user?.department_id) ?? undefined

  const params: TeacherListParams | null =
    departmentId != null && academicPeriodId != null
      ? {
          page,
          limit,
          academic_period_id: academicPeriodId,
          search,
          department_id: departmentId,
          active,
          contract_type: contractType,
          sort_by: sortBy,
          has_average: hasAverage,
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
        department_id: departmentId,
        active,
        contractType,
        sortBy,
        hasAverage,
      },
    ],
    queryFn: () => getTeachersWithAverages(params!),
    enabled: params !== null,
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
 * updateComment({ commentId: comment.id, payload: { risk_level: 2, pedagogical_category_id: 1 } });
 */
export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, payload }: { commentId: number; payload: UpdateCommentPayload }) =>
      updateComment(commentId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({
        queryKey: teachersKeys.comments(response.data.evaluation_id, response.data.teacher_id),
      })
    },
  })
}
