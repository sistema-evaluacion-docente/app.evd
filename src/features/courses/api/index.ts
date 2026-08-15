import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { useAuthStore } from '@/features/auth'
import type { CourseRecord, UpdateCoursePayload } from '../types'

interface CourseListParams {
  page: number
  limit: number
  search: string
  department_id?: number
}

/** Raw request functions. Not exported — call through the hooks below. */

async function getCourses(params: CourseListParams): Promise<ResponseAPI<CourseRecord[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.department_id) query['department_id'] = params.department_id

  return api.get('/courses/', { params: query })
}

async function updateCourse(
  courseId: number,
  payload: UpdateCoursePayload,
): Promise<ResponseAPI<CourseRecord>> {
  return api.put(`/courses/${courseId}`, payload)
}

/** Query-key factory so list invalidations stay consistent. */
export const coursesKeys = {
  all: ['courses'] as const,
  lists: () => [...coursesKeys.all, 'list'] as const,
}

/**
 * Fetches a department's courses (`GET /courses/`), for populating a course
 * picker. Defaults to the authenticated director's own department.
 *
 * @example
 * const { data, isLoading } = useListCourses({ limit: 100 });
 */
export function useListCourses({
  page = 1,
  limit = 10,
  search = '',
  departmentId,
}: {
  page?: number
  limit?: number
  search?: string
  /** Overrides the department read from the auth store. Pass `null` to omit the filter entirely. */
  departmentId?: number | null
} = {}) {
  const authDepartmentId = useAuthStore((state) => state.user?.department_id) ?? undefined
  const resolvedDepartmentId = departmentId === undefined ? authDepartmentId : departmentId

  return useQuery({
    queryKey: [
      ...coursesKeys.lists(),
      { page, limit, search, department_id: resolvedDepartmentId },
    ],
    queryFn: () =>
      getCourses({ page, limit, search, department_id: resolvedDepartmentId ?? undefined }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Updates a course's name (`PUT /courses/{course_id}`).
 *
 * @example
 * const { mutate } = useUpdateCourse();
 * mutate({ courseId: 12, payload: { name: 'Cálculo Diferencial' } });
 */
export function useUpdateCourse() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ courseId, payload }: { courseId: number; payload: UpdateCoursePayload }) =>
      updateCourse(courseId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: coursesKeys.lists() })
    },
  })
}
