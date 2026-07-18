import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { Period } from '../types/Period'

interface GetPeriodsParams {
  page: number
  limit: number
  search: string
}

/**
 * Fetches academic periods from the API.
 *
 * @param page - The page number to fetch (default is 1).
 * @param limit - The number of items per page (default is 10).
 * @param search - Optional search query to filter academic periods.
 * @returns A promise that resolves to the API response containing an array of academic periods.
 */
export default function getPeriods({
  page = 1,
  limit = 10,
  search = '',
}: GetPeriodsParams): Promise<ResponseAPI<Period[]>> {
  const params: Record<string, string | number> = {}

  if (search) params.search = search

  return api.get('/academic-periods', { params: { ...params, page, limit } })
}
