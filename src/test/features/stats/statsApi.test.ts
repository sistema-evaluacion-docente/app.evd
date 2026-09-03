import { waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import * as statsApi from '@/features/stats/api'
import { statsKeys } from '@/features/stats/api'
import { askedNothing, renderApiHook, requestOf } from '@/test/apiHarness'

vi.mock('@/config/axios', () => ({ default: { get: vi.fn() } }))

const mockApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockResolvedValue({ data: {} })
})

describe('statsKeys', () => {
  it('folds every filter into the key, so a re-filter is a new query', () => {
    expect(statsKeys.departmentPeriodRange('2027-1', '2028-1')).not.toEqual(
      statsKeys.departmentPeriodRange('2027-1', '2028-2'),
    )
    expect(statsKeys.departmentPeriodRangeSubjects('2027-1', '2028-1', 1, 10, 'a')).not.toEqual(
      statsKeys.departmentPeriodRangeSubjects('2027-1', '2028-1', 1, 10, 'b'),
    )
    expect(statsKeys.courseTeachersComparison('IS101', '2028-1')[0]).toBe('stats')
  })
})

describe('useGetDepartmentPeriodRangeStats', () => {
  it('asks for the range once both ends are picked', async () => {
    const call = await requestOf(
      () =>
        statsApi.useGetDepartmentPeriodRangeStats({ startPeriod: '2027-1', endPeriod: '2028-1' }),
      mockApi.get,
    )

    expect(call[0]).toBe('/stats/departments/period-range')
    expect(call[1]).toMatchObject({ params: { start_period: '2027-1', end_period: '2028-1' } })
  })

  it('asks nothing while only one end of the range is set', async () => {
    expect(
      await askedNothing(
        () => statsApi.useGetDepartmentPeriodRangeStats({ startPeriod: '2027-1' }),
        mockApi.get,
      ),
    ).toBe(true)
  })
})

describe('useGetDepartmentPeriodBreakdowns', () => {
  it('fires one request per period, so the chart can compare them side by side', async () => {
    const { result } = renderApiHook(() =>
      statsApi.useGetDepartmentPeriodBreakdowns(['2027-1', '2027-2', '2028-1']),
    )

    await waitFor(() => expect(result.current).toHaveLength(3))
    await waitFor(() => expect(mockApi.get).toHaveBeenCalledTimes(3))

    const starts = mockApi.get.mock.calls.map(
      ([, config]) => (config as { params: { start_period: string } }).params.start_period,
    )

    expect(starts).toEqual(['2027-1', '2027-2', '2028-1'])
  })

  it('asks nothing when no period is selected yet', async () => {
    const { result } = renderApiHook(() => statsApi.useGetDepartmentPeriodBreakdowns([]))

    await waitFor(() => expect(result.current).toHaveLength(0))

    expect(mockApi.get).not.toHaveBeenCalled()
  })
})

describe('useGetDepartmentPeriodRangeSubjects', () => {
  it('drops the blank filters instead of sending empty strings', async () => {
    const call = await requestOf(
      () =>
        statsApi.useGetDepartmentPeriodRangeSubjects({
          startPeriod: '2027-1',
          endPeriod: '2028-1',
          search: '',
          sortBy: '',
          teacherName: '',
        }),
      mockApi.get,
    )

    expect(call[0]).toBe('/stats/departments/period-range/subjects')
    expect(call[1].params).toMatchObject({
      page: 1,
      limit: 10,
      search: undefined,
      sort_by: undefined,
      teacher_name: undefined,
      modality: undefined,
    })
  })

  it('passes the filters through once the table sets them', async () => {
    const call = await requestOf(
      () =>
        statsApi.useGetDepartmentPeriodRangeSubjects({
          startPeriod: '2027-1',
          endPeriod: '2028-1',
          page: 3,
          limit: 25,
          search: 'cálculo',
          sortBy: 'average',
          teacherName: 'Ada',
          modality: 'DISTANCIA',
        }),
      mockApi.get,
    )

    expect(call[1].params).toMatchObject({
      page: 3,
      limit: 25,
      search: 'cálculo',
      sort_by: 'average',
      teacher_name: 'Ada',
      modality: 'DISTANCIA',
    })
  })

  it('waits for the range', async () => {
    expect(
      await askedNothing(
        () => statsApi.useGetDepartmentPeriodRangeSubjects({ endPeriod: '2028-1' }),
        mockApi.get,
      ),
    ).toBe(true)
  })
})

describe('useGetCourseTeachersComparison', () => {
  it('escapes the course code in the path', async () => {
    const call = await requestOf(
      () => statsApi.useGetCourseTeachersComparison({ courseCode: 'IS 101/A', period: '2028-1' }),
      mockApi.get,
    )

    expect(call[0]).toBe('/stats/departments/subjects/IS%20101%2FA/teachers-comparison')
    expect(call[1]).toMatchObject({ params: { period: '2028-1' } })
  })

  it('waits for both the course and the period', async () => {
    expect(
      await askedNothing(
        () => statsApi.useGetCourseTeachersComparison({ courseCode: 'IS101' }),
        mockApi.get,
      ),
    ).toBe(true)
  })
})
