import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { TeacherHistoryData } from '../types/Teacher'

export type HistorySortBy =
  | 'period_code_desc'
  | 'overall_average_asc'
  | 'overall_average_desc'
  | 'group_count_asc'
  | 'group_count_desc'

/**
 * Fetches the history of a teacher by their ID.
 *
 * @param id - The ID of the teacher whose history is to be fetched.
 * @param sortBy - Optional server-side sort order.
 * @returns A promise that resolves to the teacher's history data wrapped in a ResponseAPI object.
 */
export default function getTeacherHistory(
  id: number,
  sortBy?: HistorySortBy,
): Promise<ResponseAPI<TeacherHistoryData>> {
  return api.get(`/teachers/${id}/history`, { params: sortBy ? { sort_by: sortBy } : undefined })
}
