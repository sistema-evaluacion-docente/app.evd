import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { AuditLog, AuditLogDetail, AuditLogParams } from '../types'

/** Raw request functions. Not exported — call through the hooks below. */

async function getAuditLogs(params: AuditLogParams): Promise<ResponseAPI<AuditLog[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.entity_name) query['entity_name'] = params.entity_name
  if (params.operation) query['operation'] = params.operation
  if (params.date_from) query['date_from'] = params.date_from
  if (params.date_to) query['date_to'] = params.date_to
  if (params.search) query['search'] = params.search

  return api.get('/audits/', { params: query })
}

async function getAuditLogById(auditId: number): Promise<ResponseAPI<AuditLogDetail>> {
  return api.get(`/audits/${auditId}`)
}

/** Query-key factory so list invalidations stay consistent. */
export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogsKeys.all, 'list'] as const,
  detail: (id: number) => [...auditLogsKeys.all, 'detail', id] as const,
}

/**
 * Fetches the paginated list of audit logs (`GET /audits/`) with optional
 * entity, operation, date-range and free-text search filters.
 *
 * @example
 * const { data, isPending } = useGetAuditLogs({ page: 1, limit: 10, search: 'docente' });
 */
export function useGetAuditLogs({
  page = 1,
  limit = 10,
  entityName,
  operation,
  dateFrom,
  dateTo,
  search = '',
}: {
  page?: number
  limit?: number
  entityName?: string
  operation?: string
  dateFrom?: string
  dateTo?: string
  search?: string
} = {}) {
  return useQuery({
    queryKey: [
      ...auditLogsKeys.lists(),
      { page, limit, entityName, operation, dateFrom, dateTo, search },
    ],
    queryFn: () =>
      getAuditLogs({
        page,
        limit,
        entity_name: entityName,
        operation,
        date_from: dateFrom,
        date_to: dateTo,
        search,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Fetches the detailed information of a single audit log by its ID (`GET /audits/{audit_id}`).
 *
 * @example
 * const { data, isPending } = useGetAuditLogById(123);
 */
export function useGetAuditLogById(auditId: number | null) {
  return useQuery({
    queryKey: auditLogsKeys.detail(auditId ?? 0),
    queryFn: () => getAuditLogById(auditId!),
    staleTime: 60_000,
    enabled: auditId != null,
  })
}
