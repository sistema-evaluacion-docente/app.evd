import { keepPreviousData, useQuery } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { DepartmentPeriodRangeStats, DepartmentSubjectAverage } from '../types'

interface DepartmentPeriodRangeSubjectsParams {
  startPeriod: string
  endPeriod: string
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  teacherName?: string
}

/** Raw request functions. Not exported — call through the hooks below. */

async function getDepartmentPeriodRangeStats(
  startPeriod: string,
  endPeriod: string,
): Promise<ResponseAPI<DepartmentPeriodRangeStats>> {
  return api.get('/stats/departments/period-range', {
    params: { start_period: startPeriod, end_period: endPeriod },
  })
}

async function getDepartmentPeriodRangeSubjects({
  startPeriod,
  endPeriod,
  page,
  limit,
  search,
  sortBy,
  teacherName,
}: DepartmentPeriodRangeSubjectsParams): Promise<ResponseAPI<DepartmentSubjectAverage[]>> {
  return api.get('/stats/departments/period-range/subjects', {
    params: {
      start_period: startPeriod,
      end_period: endPeriod,
      page,
      limit,
      search: search || undefined,
      sort_by: sortBy || undefined,
      teacher_name: teacherName,
    },
  })
}

/** Query-key factory so range invalidations stay consistent. */
export const statsKeys = {
  all: ['stats'] as const,
  departmentPeriodRange: (startPeriod?: string, endPeriod?: string) =>
    [...statsKeys.all, 'department-period-range', { startPeriod, endPeriod }] as const,
  departmentPeriodRangeSubjects: (
    startPeriod?: string,
    endPeriod?: string,
    page?: number,
    limit?: number,
    search?: string,
    sortBy?: string,
    teacherName?: string,
  ) =>
    [
      ...statsKeys.all,
      'department-period-range-subjects',
      { startPeriod, endPeriod, page, limit, search, sortBy, teacherName },
    ] as const,
}

/**
 * Fetches the authenticated director's own department averages — overall,
 * per-period and per-dimension — across a range of academic periods
 * (`GET /stats/departments/period-range`). Only enabled once both period
 * codes are known; keeps the previous range's data visible while a new one
 * loads.
 *
 * @example
 * const { data, isPending } = useGetDepartmentPeriodRangeStats({
 *   startPeriod: '2020-1',
 *   endPeriod: '2022-1',
 * });
 */
export function useGetDepartmentPeriodRangeStats({
  startPeriod,
  endPeriod,
}: {
  startPeriod?: string
  endPeriod?: string
}) {
  return useQuery({
    queryKey: statsKeys.departmentPeriodRange(startPeriod, endPeriod),
    queryFn: () => getDepartmentPeriodRangeStats(startPeriod as string, endPeriod as string),
    enabled: Boolean(startPeriod) && Boolean(endPeriod),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}

/**
 * Fetches the paginated per-course averages of the director's own
 * department across a range of academic periods
 * (`GET /stats/departments/period-range/subjects`). Only enabled once both
 * period codes are known; keeps the previous page's data visible while the
 * next one loads.
 *
 * @example
 * const { data, isPending } = useGetDepartmentPeriodRangeSubjects({
 *   startPeriod: '2020-1',
 *   endPeriod: '2022-1',
 *   page: 1,
 *   limit: 10,
 * });
 */
export function useGetDepartmentPeriodRangeSubjects({
  startPeriod,
  endPeriod,
  page = 1,
  limit = 10,
  search,
  sortBy,
  teacherName,
}: {
  startPeriod?: string
  endPeriod?: string
  page?: number
  limit?: number
  search?: string
  sortBy?: string
  teacherName?: string
}) {
  return useQuery({
    queryKey: statsKeys.departmentPeriodRangeSubjects(
      startPeriod,
      endPeriod,
      page,
      limit,
      search,
      sortBy,
      teacherName,
    ),
    queryFn: () =>
      getDepartmentPeriodRangeSubjects({
        startPeriod: startPeriod as string,
        endPeriod: endPeriod as string,
        page,
        limit,
        search,
        sortBy,
        teacherName,
      }),
    enabled: Boolean(startPeriod) && Boolean(endPeriod),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  })
}
