import api from '@/config/axios'
import type { AuditResponse } from '../types/Audit'

export interface GetAuditsParams {
  page?: number
  limit?: number
  search?: string
  table_name?: string
  operation?: string
  start_date?: string
  end_date?: string
}

/**
 * Fetches audits from the API.
 *
 * @param page - The page number to fetch (default is 1).
 * @param limit - The number of items per page (default is 100).
 * @param search - Optional search query to filter audits.
 * @param table_name - Optional table name to filter audits.
 * @param operation - Optional operation type to filter audits.
 * @param start_date - Optional start date to filter audits (format: YYYY-MM-DD).
 * @param end_date - Optional end date to filter audits (format: YYYY-MM-DD).
 * @returns A promise that resolves to the API response containing an array of audits.
 */
export default function getAudits({
  page = 1,
  limit = 100,
  search,
  table_name,
  operation,
  start_date,
  end_date,
}: GetAuditsParams = {}): Promise<AuditResponse> {
  const params: Record<string, string | number> = {}

  if (search) {
    params.search = search
  }

  return api.get('/audits', {
    params: {
      page,
      limit,
      entity_name: table_name,
      operation,
      date_from: start_date,
      date_to: end_date,
      ...params,
    },
  })
}
