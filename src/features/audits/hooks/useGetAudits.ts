import { useQuery } from '@tanstack/react-query'
import getAudits from '../api/getAudits'

/**
 * Custom hook to fetch audits based on provided parameters.
 * @param params - An object containing the parameters for fetching audits.
 * @returns The result of the useQuery hook, including data, error, and status.
 */
export default function useGetAudits({
  page,
  limit,
  search,
  table_name,
  operation,
  start_date,
  end_date,
}: {
  page: number
  limit: number
  search: string
  table_name?: string
  operation?: string
  start_date?: string
  end_date?: string
}) {
  return useQuery({
    queryKey: ['audits', page, limit, search, table_name, operation, start_date, end_date],
    queryFn: () =>
      getAudits({
        page,
        limit,
        search,
        table_name,
        operation,
        start_date,
        end_date,
      }),
  })
}
