import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import {
  evaluationsKeys,
  useAnalyzeEvaluation,
  useEvaluationLogs,
  useGetEvaluations,
  type AiStatus,
} from '@/features/evaluations'
import { statsKeys } from '../api'

export interface PeriodCommentsAnalysis {
  /** AI status of the period's evaluation, or `null` while it is unknown. */
  aiStatus: AiStatus | null
  /**
   * `aiStatus` says nothing yet: the request is still in flight, or what came
   * back belongs to the period that was selected before. Whoever renders on it
   * has to wait rather than read the `null` as "nothing to analyze".
   */
  isStatusPending: boolean
  /** The analysis is running — the request itself, or the job behind it. */
  isAnalyzing: boolean
  /** Starts the analysis. A no-op until the period's evaluation is known. */
  analyze: () => void
}

/**
 * The AI analysis of one period's comments, as the department summary needs it:
 * what state it is in, and how to start it.
 *
 * The comment breakdowns are built out of classifications the model writes, so
 * before the analysis runs every count is a legitimate zero — which reads on
 * screen exactly like "this department got no comments". Telling the two apart
 * takes the evaluation's `ai_status`, which the department stats endpoint does
 * not carry, so it is resolved from the evaluations list: that one is scoped to
 * the caller's own department (`GET /evaluations?period_id=&department_id=`),
 * unlike `/evaluations/by-period/{id}`, which answers with whatever department
 * loaded that period first.
 *
 * Finishing is picked up twice over, and neither needs a reload: the progress
 * WebSocket invalidates the stats as soon as the job reports itself done (the
 * globally mounted `EvaluationLogsPanel` does the invalidating, and shows the
 * log while it runs), and the list poll behind `ai_status` catches the same
 * transition on its own if that socket never connects.
 *
 * @example
 * const analysis = usePeriodCommentsAnalysis(periodId)
 * <DepartmentCommentsSummary aiStatus={analysis.aiStatus} onAnalyze={analysis.analyze} />
 */
export function usePeriodCommentsAnalysis(periodId?: number): PeriodCommentsAnalysis {
  const queryClient = useQueryClient()
  const { connect } = useEvaluationLogs()
  const { mutate, isPending: isStarting, isSuccess: hasStarted } = useAnalyzeEvaluation()

  const { data, isPending, isPlaceholderData } = useGetEvaluations({
    period_id: periodId,
    limit: 1,
    enabled: periodId != null,
  })

  const evaluation = periodId != null ? data?.data?.[0] : undefined
  const aiStatus = evaluation?.ai_status ?? null

  // A query held back by `enabled` also reports `isPending`, so the period is
  // what tells "not asked" apart from "asked and waiting". `isPlaceholderData`
  // covers the other half: on a period change the previous period's evaluation
  // stays on screen, and its status does not describe the one now selected.
  const isStatusPending = periodId != null && (isPending || isPlaceholderData)

  // The run is queued as a background task, so the 202 comes back before the
  // row says `ANALYZING`. The request having gone through is what carries the
  // button across that window — without it it would blink back to "Analizar"
  // for the one refetch that still reads `PENDING`. It stops counting once the
  // row reaches a verdict of its own.
  const settled = aiStatus === 'ANALYZED' || aiStatus === 'FAILED'

  const isAnalyzing = aiStatus === 'ANALYZING' || ((isStarting || hasStarted) && !settled)

  // The socket is the fast path; this is the one that still fires when it never
  // connected. Only the ANALYZING → ANALYZED edge invalidates, so a summary
  // opened on an already-analyzed period doesn't refetch itself on mount.
  const wasAnalyzing = useRef(false)

  useEffect(() => {
    if (aiStatus === 'ANALYZING') {
      wasAnalyzing.current = true
      return
    }

    if (wasAnalyzing.current && aiStatus === 'ANALYZED') {
      wasAnalyzing.current = false
      queryClient.invalidateQueries({ queryKey: statsKeys.all })
    }
  }, [aiStatus, queryClient])

  function analyze() {
    if (!evaluation) return

    connect({
      evaluationId: evaluation.id,
      queryKeysToInvalidate: [statsKeys.all, evaluationsKeys.lists()],
      detailsUrl: `/evaluaciones/${evaluation.id}`,
    })

    mutate(evaluation.id)
  }

  return { aiStatus, isStatusPending, isAnalyzing, analyze }
}
