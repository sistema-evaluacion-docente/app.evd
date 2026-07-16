import { useQuery } from '@tanstack/react-query'

import getDirectors from '../api/getDirectors'

/**
 * Custom hook to fetch directors with pagination support.
 * @param page The page number to fetch. Defaults to 1.
 * @param limit The number of directors to fetch per page. Defaults to 10.
 * @param search Optional search term to filter directors by name or other criteria.
 * @param active Optional string to filter directors by their active status ("true" or "false").
 * @returns A query object containing the fetched directors and query status.
 */
export default function useGetDirectors({
  page = 1,
  limit = 10,
  search = '',
  active,
}: {
  page: number
  limit: number
  search: string
  active?: string
}) {
  return useQuery({
    queryKey: ['directors', page, limit, search, active],
    queryFn: () =>
      getDirectors({
        page,
        limit,
        search,
        active: active !== undefined ? active === 'true' : undefined,
      }),
  })
}
