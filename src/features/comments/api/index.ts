import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { TeacherComment } from '@/features/teachers'

interface CommentListParams {
  page: number
  limit: number
  academic_period_id?: number
  teacher_id?: number
  risk_level?: number
  pedagogical_category_id?: number
  search?: string
}

/** Raw request functions. Not exported — call through the hooks below. */

async function getComments(params: CommentListParams): Promise<ResponseAPI<TeacherComment[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.academic_period_id) query['academic_period_id'] = params.academic_period_id
  if (params.teacher_id) query['teacher_id'] = params.teacher_id
  if (params.risk_level) query['risk_level'] = params.risk_level
  if (params.pedagogical_category_id)
    query['pedagogical_category_id'] = params.pedagogical_category_id
  if (params.search) query['search'] = params.search

  return api.get('/comments/', { params: query })
}

/** Query-key factory so list invalidations stay consistent. */
export const commentsKeys = {
  all: ['comments'] as const,
  lists: () => [...commentsKeys.all, 'list'] as const,
}

/**
 * Fetches the paginated list of comments across teachers, filtered by
 * academic period, teacher, risk level, pedagogical category and/or free
 * text (`GET /comments/`).
 *
 * @example
 * const { data, isPending } = useGetComments({ page, limit, academicPeriodId, search });
 */
export function useGetComments({
  page = 1,
  limit = 10,
  academicPeriodId,
  teacherId,
  riskLevel,
  pedagogicalCategoryId,
  search = '',
  enabled = true,
}: {
  page?: number
  limit?: number
  academicPeriodId?: number
  teacherId?: number
  riskLevel?: number
  pedagogicalCategoryId?: number
  search?: string
  /** Set to false while a required filter (e.g. the period) hasn't resolved yet. */
  enabled?: boolean
} = {}) {
  return useQuery({
    queryKey: [
      ...commentsKeys.lists(),
      { page, limit, academicPeriodId, teacherId, riskLevel, pedagogicalCategoryId, search },
    ],
    queryFn: () =>
      getComments({
        page,
        limit,
        academic_period_id: academicPeriodId,
        teacher_id: teacherId,
        risk_level: riskLevel,
        pedagogical_category_id: pedagogicalCategoryId,
        search,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled,
  })
}
