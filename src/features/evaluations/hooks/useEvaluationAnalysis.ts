import { useState } from 'react'

import { useAnalyzeEvaluation } from '../api'
import type { AiStatus } from '../types'
import { useEvaluationLogs } from './useEvaluationLogs'

export interface EvaluationAnalysis {
  /** The analysis is running — the request itself, or the job behind it. */
  isAnalyzing: boolean
  /** Starts the analysis. A no-op without an evaluation or while one is running. */
  analyze: () => void
}

/**
 * Starting the AI analysis of one evaluation, and knowing it is under way from
 * the very click on — which `ai_status` alone does not tell.
 *
 * The run is queued as a background task, so the 202 comes back before the row
 * says `ANALYZING`: for a refetch or two it still reads the status it had before
 * (`PENDING`, or a previous `FAILED`). Going by the mutation alone, the
 * "Analizar" button came back in that gap, and a second click queued a second
 * run over the first. So the status the row had when the run was asked for is
 * kept, and the run counts as going until the row moves off it.
 *
 * The progress WebSocket is opened alongside, with the queries to refresh once
 * the job reports itself done.
 *
 * @example
 * const { isAnalyzing, analyze } = useEvaluationAnalysis(evaluation, {
 *   queryKeysToInvalidate: [evaluationsKeys.lists()],
 * })
 */
export function useEvaluationAnalysis(
  evaluation: { id: number; ai_status: AiStatus | null } | undefined,
  { queryKeysToInvalidate = [] }: { queryKeysToInvalidate?: readonly (readonly unknown[])[] } = {},
): EvaluationAnalysis {
  const { connect } = useEvaluationLogs()
  const { mutate, isPending: isStarting } = useAnalyzeEvaluation()

  const aiStatus = evaluation?.ai_status ?? null

  const [requested, setRequested] = useState<{ id: number; from: AiStatus | null } | null>(null)

  // Once the row has moved on (or another evaluation is on screen) it speaks
  // for itself again.
  if (requested && (requested.id !== evaluation?.id || requested.from !== aiStatus)) {
    setRequested(null)
  }

  const isAnalyzing = aiStatus === 'ANALYZING' || isStarting || requested != null

  function analyze() {
    if (!evaluation || isAnalyzing) return

    setRequested({ id: evaluation.id, from: aiStatus })

    connect({
      evaluationId: evaluation.id,
      queryKeysToInvalidate,
      detailsUrl: `/evaluaciones/${evaluation.id}`,
    })

    mutate(evaluation.id, {
      // A request that never went through leaves the run free to try again.
      onError: () => setRequested(null),
    })
  }

  return { isAnalyzing, analyze }
}
