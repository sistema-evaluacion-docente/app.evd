import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import * as adminApi from '@/features/admin/api'
import { auditLogsKeys, settingHistoryKeys, settingsKeys } from '@/features/admin/api'
import { ApiError } from '@/lib/apiError'
import { askedNothing, renderApiHook, requestOf } from '@/test/apiHarness'

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const mockApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockResolvedValue({ data: {} })
  mockApi.post.mockResolvedValue({ data: {} })
  mockApi.put.mockResolvedValue({ data: {} })
  mockApi.delete.mockResolvedValue({ data: undefined })
})

async function mutate<V>(hook: () => { mutateAsync: (vars: V) => Promise<unknown> }, vars: V) {
  const { result } = renderApiHook(hook)

  await act(async () => {
    await result.current.mutateAsync(vars)
  })
}

describe('keys', () => {
  it('tells a global setting apart from a department’s override of it', () => {
    expect(settingsKeys.byKey('umbral')).toEqual(['settings', 'by-key', 'umbral', null])
    expect(settingsKeys.byKey('umbral', 3)).toEqual(['settings', 'by-key', 'umbral', 3])
    expect(auditLogsKeys.detail(5)).toEqual(['audit-logs', 'detail', 5])
    expect(settingHistoryKeys.list(5)).toEqual(['settings', 'history', '5'])
  })
})

describe('audit logs', () => {
  it('sends only the filters the screen has set', async () => {
    const call = await requestOf(() => adminApi.useGetAuditLogs(), mockApi.get)

    expect(call[0]).toBe('/audits/')
    expect(call[1].params).toEqual({ page: 1, limit: 10 })
  })

  it('passes the whole filter bar through', async () => {
    const call = await requestOf(
      () =>
        adminApi.useGetAuditLogs({
          entityName: 'Teacher',
          operation: 'UPDATE',
          dateFrom: '2028-01-01',
          dateTo: '2028-02-01',
          search: 'ada',
        }),
      mockApi.get,
    )

    expect(call[1].params).toMatchObject({
      entity_name: 'Teacher',
      operation: 'UPDATE',
      date_from: '2028-01-01',
      date_to: '2028-02-01',
      search: 'ada',
    })
  })

  it('fetches one log, and waits for a row to be picked', async () => {
    expect(await askedNothing(() => adminApi.useGetAuditLogById(null), mockApi.get)).toBe(true)

    const call = await requestOf(() => adminApi.useGetAuditLogById(5), mockApi.get)

    expect(call[0]).toBe('/audits/5')
  })
})

describe('settings', () => {
  it('sends only the filters that were set', async () => {
    const call = await requestOf(() => adminApi.useGetSettings(), mockApi.get)

    expect(call[1].params).toEqual({ page: 1, limit: 10 })
  })

  it('keeps a department_id of 0 and include_global of false, which are real values', async () => {
    const call = await requestOf(
      () =>
        adminApi.useGetSettings({
          search: 'umbral',
          valueType: 'NUMBER',
          departmentId: 0,
          includeGlobal: false,
        }),
      mockApi.get,
    )

    expect(call[1].params).toMatchObject({
      search: 'umbral',
      value_type: 'NUMBER',
      department_id: 0,
      include_global: false,
    })
  })

  it('escapes the key, which is free-form text', async () => {
    const call = await requestOf(() => adminApi.useGetSettingByKey('plan/umbral', 3), mockApi.get)

    expect(call[0]).toBe('/settings/by-key/plan%2Fumbral')
    expect(call[1]).toMatchObject({
      params: { department_id: 3 },
      // The 404 below is an expected state, so the generic toast is suppressed.
      skipErrorToast: true,
    })
  })

  it('reads a key nobody has configured yet as null, not as a failure', async () => {
    mockApi.get.mockRejectedValue(new ApiError('No existe', { status: 404 }))

    const { result } = renderApiHook(() => adminApi.useGetSettingByKey('umbral'))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isError).toBe(false)
  })

  it('still surfaces any other status', async () => {
    mockApi.get.mockRejectedValue(new ApiError('Sin permiso', { status: 403 }))

    const { result } = renderApiHook(() => adminApi.useGetSettingByKey('umbral'))

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.isSuccess).toBe(false)
  })

  it('creates, updates and deletes a setting', async () => {
    await mutate(() => adminApi.useCreateSetting(), { key: 'umbral', value: '3' } as never)
    expect(mockApi.post).toHaveBeenCalledWith('/settings/', { key: 'umbral', value: '3' })

    await mutate(() => adminApi.useUpdateSetting(), {
      settingId: 5,
      payload: { value: '4' } as never,
    })
    expect(mockApi.put).toHaveBeenCalledWith('/settings/5', { value: '4' })

    await mutate(() => adminApi.useDeleteSetting(), 5)
    expect(mockApi.delete).toHaveBeenCalledWith('/settings/5')
  })

  it('fetches a setting’s history once one is picked', async () => {
    expect(await askedNothing(() => adminApi.useGetSettingHistory(), mockApi.get)).toBe(true)

    const call = await requestOf(
      () => adminApi.useGetSettingHistory({ settingId: 5, page: 2, limit: 20 }),
      mockApi.get,
    )

    expect(call[0]).toBe('/settings/5/history')
    expect(call[1]).toMatchObject({ params: { page: 2, limit: 20 } })
  })
})
