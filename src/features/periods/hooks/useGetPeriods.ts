import { useQuery } from '@tanstack/react-query'
import getPeriods from '../api/getPeriods'

/**
 * Custom hook to fetch periods with pagination and search functionality.
 *
 * @param {Object} options - Options for fetching periods.
 * @param {number} options.page - The page number to fetch (default is 1).
 * @param {number} options.limit - The number of items per page (default is 10).
 * @param {string} options.search - The search term to filter periods (default is an empty string).
 * @param {boolean} [options.active] - Optional flag to filter active periods.
 *
 * @returns {Object} An object containing the query result, including data, loading state, and error state.
 */
export default function useGetPeriods({
  page = 1,
  limit = 10,
  search = '',
  active,
}: {
  page: number
  limit: number
  search: string
  active?: boolean
}) {
  const params: Record<string, unknown> = {}

  if (active !== undefined) {
    params.active = active
  }

  return useQuery({
    queryKey: ['periods', page, limit, search],
    queryFn: () => getPeriods({ page, limit, search, ...params }),
  })
}
