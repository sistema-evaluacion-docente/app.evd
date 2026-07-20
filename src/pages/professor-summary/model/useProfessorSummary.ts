import { useMemo, useState } from 'react'

import { useGetTeacherComments, useGetTeacherVsDepartment } from '@/features/evaluations'
import { useGetTeacherHistory } from '@/features/teachers'
import useAuth from '@/shared/hooks/useAuth'

import {
  buildProfessorSummary,
  mapProfessorComments,
  mapProfessorHistory,
  mapProfessorPeriods,
  type ProfessorSummary,
} from './data'

/**
 * Loads the logged-in professor's evaluation summary. The period select is
 * built from the teacher's history, so it only offers periods that actually
 * have an evaluation.
 */
export function useProfessorSummary() {
  const { user } = useAuth()
  const teacherId = user?.teacher_id ?? 0

  const historyQuery = useGetTeacherHistory(teacherId)

  const periods = useMemo(
    () => mapProfessorPeriods(historyQuery.data?.data.history ?? []),
    [historyQuery.data],
  )

  const history = useMemo(
    () => mapProfessorHistory(historyQuery.data?.data.history ?? []),
    [historyQuery.data],
  )

  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const period =
    periods.find((item) => item.value === selectedValue) ?? periods[0] ?? null

  const vsDeptQuery = useGetTeacherVsDepartment(teacherId, period?.periodId)
  const commentsQuery = useGetTeacherComments(period?.evaluationId, teacherId)

  const summary: ProfessorSummary | null = useMemo(() => {
    const vsDept = vsDeptQuery.data?.data
    if (!period || !vsDept) return null

    const comments = commentsQuery.data?.data
      ? mapProfessorComments(commentsQuery.data.data)
      : []
    const historyEntry = historyQuery.data?.data.history.find(
      (entry) => entry.period_id === period.periodId,
    )
    return buildProfessorSummary(vsDept, comments, historyEntry)
  }, [period, vsDeptQuery.data, commentsQuery.data, historyQuery.data])

  return {
    user,
    hasTeacherId: teacherId > 0,
    periods,
    history,
    period,
    setPeriodValue: setSelectedValue,
    summary,
    isLoading:
      historyQuery.isLoading || vsDeptQuery.isLoading || commentsQuery.isLoading,
    isError: historyQuery.isError || vsDeptQuery.isError || commentsQuery.isError,
  }
}
