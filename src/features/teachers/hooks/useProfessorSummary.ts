import { useMemo } from 'react'

import { useGetTeacherComments, useGetTeacherVsPreviousPeriod } from '@/features/evaluations'
import useAuth from '@/shared/hooks/useAuth'
import {
  buildProfessorSummary,
  mapProfessorComments,
  mapProfessorHistory,
  mapProfessorPeriods,
  type ProfessorSummary,
} from '../model/professorSummary'
import useGetTeacherHistory from './useGetTeacherHistory'

export interface UseProfessorSummaryOptions {
  commentsEnabled?: boolean
  periodValue?: string | null
  teacherId?: number
  historyData?: ReturnType<typeof useGetTeacherHistory>['data']
}

export function useProfessorSummary(options?: UseProfessorSummaryOptions) {
  const { user } = useAuth()
  const teacherId = options?.teacherId ?? user?.teacher_id ?? 0

  const historyQuery = useGetTeacherHistory(teacherId)

  const historyData = options?.historyData ?? historyQuery.data

  const periods = useMemo(
    () => mapProfessorPeriods(historyData?.data.items ?? []),
    [historyData],
  )

  const history = useMemo(
    () => mapProfessorHistory(historyData?.data.items ?? []),
    [historyData],
  )

  const selectedValue = options?.periodValue ?? null
  const period = periods.find((item) => item.code === selectedValue) ?? periods[0] ?? null

  const vsPrevPeriodQuery = useGetTeacherVsPreviousPeriod(teacherId, period?.periodId)
  const commentsQuery = useGetTeacherComments(period?.evaluationId, teacherId, {
    enabled: options?.commentsEnabled,
  })

  const summary: ProfessorSummary | null = useMemo(() => {
    const vsPrevPeriod = vsPrevPeriodQuery.data?.data
    if (!period || !vsPrevPeriod) return null

    const comments = commentsQuery.data?.data ? mapProfessorComments(commentsQuery.data.data) : []
    return buildProfessorSummary(vsPrevPeriod, comments)
  }, [period, vsPrevPeriodQuery.data, commentsQuery.data])

  return {
    user,
    teacherId,
    hasTeacherId: teacherId > 0,
    periods,
    history,
    period,
    summary,
    vsPrevPeriod: vsPrevPeriodQuery.data?.data,
    isCommentsLoading: commentsQuery.isLoading,
    isLoading: historyQuery.isLoading || vsPrevPeriodQuery.isLoading,
    isError: historyQuery.isError || vsPrevPeriodQuery.isError || commentsQuery.isError,
  }
}
