import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { Director } from '../types/Director'

/**
 * Fetches a list of directors from the API with optional pagination and search parameters.
 *
 * @param page Optional page number to fetch. Defaults to 1.
 * @param limit Optional number of directors to fetch per page. Defaults to 10.
 * @param search Optional search term to filter directors by name or other criteria.
 * @param active Optional boolean to filter directors by their active status.
 * @returns A promise that resolves to a ResponseAPI containing an array of Director objects.
 */
export default function getDirectors({
  page = 1,
  limit = 10,
  search = '',
  active,
}: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
}): Promise<ResponseAPI<Director[]>> {
  const params: Record<string, string | number | boolean> = {}

  if (search) {
    params.search = search
  }

  if (active !== undefined) {
    params.active = active
  }

  return api.get('/directors', {
    params: { ...params, page, limit },
  })
}
