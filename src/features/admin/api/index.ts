import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type {
  AuditLog,
  AuditLogDetail,
  AuditLogParams,
  Setting,
  SettingHistory,
  SettingHistoryParams,
  SettingParams,
  UpdateSettingPayload,
} from '../types'

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

async function getSettings(params: SettingParams): Promise<ResponseAPI<Setting[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search

  return api.get('/settings/', { params: query })
}

async function updateSetting(
  settingId: number,
  payload: UpdateSettingPayload,
): Promise<ResponseAPI<Setting>> {
  return api.put(`/settings/${settingId}`, payload)
}

async function deleteSetting(settingId: number): Promise<ResponseAPI<void>> {
  return api.delete(`/settings/${settingId}`)
}

async function getSettingHistory(
  settingId: number,
  params: SettingHistoryParams,
): Promise<ResponseAPI<SettingHistory[]>> {
  return api.get(`/settings/${settingId}/history`, { params })
}

/** Query-key factory so list invalidations stay consistent. */
export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogsKeys.all, 'list'] as const,
  detail: (id: number) => [...auditLogsKeys.all, 'detail', id] as const,
}

/** Query-key factory so list invalidations stay consistent. */
export const settingsKeys = {
  all: ['settings'] as const,
  lists: () => [...settingsKeys.all, 'list'] as const,
}

/** Query-key factory for a single setting's change history. */
export const settingHistoryKeys = {
  all: ['settings', 'history'] as const,
  list: (settingId: number) => [...settingHistoryKeys.all, String(settingId)] as const,
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

/**
 * Fetches the paginated list of system settings (`GET /settings/`) with an
 * optional free-text search over key and description.
 *
 * @example
 * const { data, isPending } = useGetSettings({ page: 1, limit: 10, search: 'matricula' });
 */
export function useGetSettings({
  page = 1,
  limit = 10,
  search = '',
}: {
  page?: number
  limit?: number
  search?: string
} = {}) {
  return useQuery({
    queryKey: [...settingsKeys.lists(), { page, limit, search }],
    queryFn: () => getSettings({ page, limit, search }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Updates a setting's value (`PUT /settings/{setting_id}`).
 * Invalidates the settings list on success.
 *
 * @example
 * const { mutate: updateSetting } = useUpdateSetting();
 * updateSetting({ settingId: 1, payload: { value: '50', change_reason: 'Nuevo cupo máximo' } });
 */
export function useUpdateSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ settingId, payload }: { settingId: number; payload: UpdateSettingPayload }) =>
      updateSetting(settingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() })
    },
  })
}

/**
 * Deletes a system setting (`DELETE /settings/{setting_id}`).
 * Invalidates the settings list on success.
 *
 * @example
 * const { mutate: deleteSetting } = useDeleteSetting();
 * deleteSetting(1);
 */
export function useDeleteSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settingId: number) => deleteSetting(settingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.lists() })
    },
  })
}

/**
 * Fetches the paginated change history of a setting (`GET /settings/{setting_id}/history`).
 * Disabled while `settingId` is null.
 *
 * @example
 * const { data, isPending } = useGetSettingHistory({ settingId: 1, page: 1, limit: 10 });
 */
export function useGetSettingHistory({
  settingId = null,
  page = 1,
  limit = 10,
}: {
  settingId?: number | null
  page?: number
  limit?: number
} = {}) {
  return useQuery({
    queryKey: [...settingHistoryKeys.list(settingId ?? 0), { page, limit }],
    queryFn: () => getSettingHistory(settingId!, { page, limit }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled: settingId != null,
  })
}
