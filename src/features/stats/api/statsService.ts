import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'

export interface TeacherRankingItem {
  teacher_id: number
  institutional_code: string
  name: string
  avatar_url: string | null
  contract_type: string | null
  group_count: number
  overall_average: number | null
}

/**
 * Fetches the paginated ranking of teachers based on their evaluation scores.
 *
 * @param page - The page number to fetch.
 * @param limit - The number of items per page.
 * @param search - A search term to filter the results.
 * @param sort - The sorting order, either "asc" or "desc".
 * @param academicPeriodId - (Optional) The ID of the academic period to filter the results.
 * @param departmentId - (Optional) The ID of the department to filter the results.
 * @returns A promise that resolves to a ResponseAPI object containing an array of TeacherRankingItem.
 */
export function getTeacherRanking(
  page: number,
  limit: number,
  search: string,
  sort: 'asc' | 'desc',
  academicPeriodId?: number,
  departmentId?: number,
): Promise<ResponseAPI<TeacherRankingItem[]>> {
  const params = new URLSearchParams()

  params.set('page', String(page))
  params.set('limit', String(limit))
  params.set('sort', sort)

  if (search) params.set('search', search)
  if (academicPeriodId) params.set('academic_period_id', String(academicPeriodId))
  if (departmentId) params.set('department_id', String(departmentId))

  return api.get(`/stats/teachers/ranking/paginated?${params.toString()}`)
}
