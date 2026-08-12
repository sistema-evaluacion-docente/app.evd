import { useQueries } from '@tanstack/react-query'

import { getTeacherComments, getTeacherEvaluationDetail } from '@/features/evaluations'

import {
  buildSubjectHistory,
  mapProfessorComments,
  type ProfessorPeriod,
  type SubjectHistory,
} from './data'

export interface UseSubjectHistoryResult extends SubjectHistory {
  isLoading: boolean
  isError: boolean
}

/**
 * Fans out, per period, the teacher's evaluation detail (subject grades) and
 * comments, then rebuilds the cross-semester history. Query keys match the
 * single-period hooks so results are shared from cache.
 */
export function useSubjectHistory(
  teacherId: number,
  periods: ProfessorPeriod[],
  enabled = true,
): UseSubjectHistoryResult {
  const detailQueries = useQueries({
    queries: periods.map((period) => ({
      queryKey: ['teacher-evaluation-detail', period.evaluationId, teacherId],
      queryFn: () => getTeacherEvaluationDetail(period.evaluationId, teacherId),
      enabled: enabled && teacherId > 0 && period.evaluationId > 0,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const commentQueries = useQueries({
    queries: periods.map((period) => ({
      queryKey: ['teacher-comments', period.evaluationId, teacherId],
      queryFn: () => getTeacherComments(period.evaluationId, teacherId),
      enabled: enabled && teacherId > 0 && period.evaluationId > 0,
      staleTime: 5 * 60 * 1000,
    })),
  })

  const entries = periods.map((period, index) => {
    const commentData = commentQueries[index]?.data?.data
    return {
      period,
      detail: detailQueries[index]?.data?.data,
      comments: commentData ? mapProfessorComments(commentData) : [],
    }
  })

  const { subjects, commentsByPeriod } = buildSubjectHistory(entries)

  return {
    subjects,
    commentsByPeriod,
    isLoading:
      enabled &&
      (detailQueries.some((query) => query.isLoading) ||
        commentQueries.some((query) => query.isLoading)),
    isError:
      detailQueries.some((query) => query.isError) ||
      commentQueries.some((query) => query.isError),
  }
}
