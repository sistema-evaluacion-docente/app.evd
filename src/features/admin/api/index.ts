import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import { ApiError } from '@/lib/apiError'
import type {
  AuditLog,
  AuditLogDetail,
  AuditLogParams,
  CreateSettingPayload,
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
  if (params.value_type) query['value_type'] = params.value_type
  if (params.department_id != null) query['department_id'] = params.department_id
  if (params.include_global != null) query['include_global'] = params.include_global

  return api.get('/settings/', { params: query })
}

async function getSettingByKey(key: string, departmentId?: number): Promise<Setting | null> {
  try {
    const response: ResponseAPI<Setting> = await api.get(
      `/settings/by-key/${encodeURIComponent(key)}`,
      {
        params: departmentId != null ? { department_id: departmentId } : undefined,
        skipErrorToast: true,
      },
    )

    return response.data
  } catch (error) {
    // A key nobody has configured yet is the starting state of a settings
    // screen, not a failure — every other status still reaches the caller.
    if (error instanceof ApiError && error.status === 404) return null

    throw error
  }
}

async function createSetting(payload: CreateSettingPayload): Promise<ResponseAPI<Setting>> {
  return api.post('/settings/', payload)
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
  byKey: (key: string, departmentId?: number) =>
    [...settingsKeys.all, 'by-key', key, departmentId ?? null] as const,
}

/**
 * Query options for the setting in effect for a key — the department's own
 * value when it has one, the institutional value otherwise, and `null` when
 * neither exists yet (`GET /settings/by-key/{key}`). A DIRECTOR is pinned to
 * their own department, so `departmentId` is only meaningful for an ADMIN.
 *
 * Shared as options rather than a hook so the same fetch can be awaited
 * imperatively (`queryClient.fetchQuery`) before a write, which is how a
 * caller checks nobody else changed the value in the meantime.
 *
 * @example
 * const { data: setting } = useQuery(settingByKeyQueryOptions('improvement_plan.suggested_actions'));
 */
export function settingByKeyQueryOptions(key: string, departmentId?: number) {
  return queryOptions({
    queryKey: settingsKeys.byKey(key, departmentId),
    queryFn: () => getSettingByKey(key, departmentId),
    staleTime: 60_000,
    retry: false,
  })
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
  valueType,
  departmentId,
  includeGlobal,
}: {
  page?: number
  limit?: number
  search?: string
  valueType?: string
  departmentId?: number
  includeGlobal?: boolean
} = {}) {
  return useQuery({
    queryKey: [
      ...settingsKeys.lists(),
      { page, limit, search, valueType, departmentId, includeGlobal },
    ],
    queryFn: () =>
      getSettings({
        page,
        limit,
        search,
        value_type: valueType,
        department_id: departmentId,
        include_global: includeGlobal,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Resolves the setting in effect for a key — see `settingByKeyQueryOptions`.
 * `data` is `null` when the key has never been configured.
 *
 * @example
 * const { data: setting, isPending } = useGetSettingByKey('improvement_plan.suggested_actions');
 */
export function useGetSettingByKey(key: string, departmentId?: number) {
  return useQuery(settingByKeyQueryOptions(key, departmentId))
}

/**
 * Creates a setting (`POST /settings/`). A DIRECTOR uses it to override an
 * institutional value with one of their own — the backend attaches their
 * department. Invalidates the settings list on success.
 *
 * @example
 * const { mutate: createSetting } = useCreateSetting();
 * createSetting({ key: 'max_hours', value: '40', value_type: 'STRING' });
 */
export function useCreateSetting() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSettingPayload) => createSetting(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
    },
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
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
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
      queryClient.invalidateQueries({ queryKey: settingsKeys.all })
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
