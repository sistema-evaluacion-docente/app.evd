import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { Department } from '../types/Department'

/**
 * Fetches departments from the API.
 *
 * @param page - The page number to fetch (default is 1).
 * @param limit - The number of items per page (default is 10).
 * @param search - Optional search query to filter departments.
 * @returns A promise that resolves to the API response containing an array of departments.
 */
export default function getDepartments({
  page = 1,
  limit = 10,
  search,
}: {
  page?: number
  limit?: number
  search?: string
}): Promise<ResponseAPI<Department[]>> {
  const params: Record<string, string | number> = {}

  if (search) {
    params.search = search
  }

  return api.get('/departments', {
    params: { page, limit, ...params },
  })
}
