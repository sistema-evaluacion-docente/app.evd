import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { Faculty } from '../types/Faculty'

/**
 * Fetches faculties from the API.
 *
 * @param page - The page number to fetch (default is 1).
 * @param limit - The number of items per page (default is 10).
 * @param search - Optional search query to filter faculties.
 * @returns A promise that resolves to the API response containing an array of faculties.
 */
export default function getFaculties({
  page = 1,
  limit = 10,
  search,
}: {
  page?: number
  limit?: number
  search?: string
}): Promise<ResponseAPI<Faculty[]>> {
  const params: Record<string, string | number> = {}

  if (search) {
    params.search = search
  }

  return api.get('/faculties', {
    params: { page, limit, search },
  })
}
