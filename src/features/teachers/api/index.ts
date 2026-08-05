import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type { TeacherDetail, TeacherRecord, TeacherUploadData } from '../types'

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

async function getTeacherDetail(
  teacherId: number,
  periodName: string,
): Promise<ResponseAPI<TeacherDetail>> {
  return api.get(`/evaluations/teachers/${teacherId}/detail`, {
    params: { period_name: periodName },
  })
}

async function uploadTeachers(file: File): Promise<ResponseAPI<TeacherUploadData>> {
  const formData = new FormData()
  formData.append('file', file)

  return api.post('/teachers/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}

/** Query-key factory so list invalidations stay consistent. */
export const teachersKeys = {
  all: ['teachers'] as const,
  lists: () => [...teachersKeys.all, 'list'] as const,
  detail: (teacherId: number, periodName: string) =>
    [...teachersKeys.all, 'detail', teacherId, periodName] as const,
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
