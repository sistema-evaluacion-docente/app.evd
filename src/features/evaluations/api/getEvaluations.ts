import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { EvaluationRecord } from '../types/Evaluation'

interface GetEvaluationsParams {
  page: number
  limit: number
  search: string
  period_id?: string
  department_id?: number
  sort_by?: string
}

/**
 * Fetches evaluations from the API.
 *
 * @param page - The page number to fetch (default is 1).
 * @param limit - The number of items per page (default is 10).
 * @param search - Optional search query to filter evaluations.
 * @param period_id - Optional period ID to filter evaluations.
 * @param department_id - Optional department ID to filter evaluations.
 * @param sort_by - Optional sorting criteria for evaluations.
 * @returns A promise that resolves to the API response containing an array of evaluation records.
 */
export default function getEvaluations({
  page = 1,
  limit = 10,
  search = '',
  period_id,
  department_id,
  sort_by,
}: GetEvaluationsParams): Promise<ResponseAPI<EvaluationRecord[]>> {
  const params: Record<string, string | number> = {}

  if (search) params.search = search
  if (period_id) params.period_id = period_id
  if (department_id) params.department_id = department_id
  if (sort_by) params.sort_by = sort_by

  return api.get('/evaluations', { params: { ...params, page, limit } })
}
