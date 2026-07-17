import { useQuery } from '@tanstack/react-query'

import getTeachers from '../api/getTeachers'

/**
 * Custom hook to fetch teachers data with pagination, search, and filtering options.
 *
 * @param {Object} params - The parameters for fetching teachers.
 * @param {number} params.page - The current page number (default is 1).
 * @param {number} params.limit - The number of items per page (default is 10).
 * @param {string} params.search - The search query string (default is an empty string).
 * @param {string} [params.academic_period_id] - Optional academic period ID for filtering.
 * @param {number} [params.department_id] - Optional department ID for filtering.
 * @param {string} [params.active] - Optional active status filter ("true" or "false").
 *
 * @returns {Object} The result of the useQuery hook containing the fetched data and query status.
 */
export default function useGetTeachers({
  page = 1,
  limit = 10,
  search = '',
  academic_period_id,
  department_id,
  active,
}: {
  page: number
  limit: number
  search: string
  academic_period_id?: string
  department_id?: number
  active?: string
}) {
  return useQuery({
    queryKey: ['teachers', page, limit, search, academic_period_id, active],
    queryFn: () =>
      getTeachers({
        page,
        limit,
        search,
        academic_period_id: academic_period_id ? Number(academic_period_id) : undefined,
        active: active !== undefined ? active === 'true' : undefined,
        department_id: department_id ? Number(department_id) : undefined,
      }),
  })
}
