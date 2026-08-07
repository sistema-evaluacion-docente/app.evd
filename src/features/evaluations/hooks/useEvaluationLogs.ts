import { useEvaluationLogsStore } from '../store'

/**
 * Exposes evaluation progress logs and connection controls from the
 * evaluation logs store.
 *
 * @example
 * const { logs, connect, disconnect, clearLogs } = useEvaluationLogs();
 */
export function useEvaluationLogs() {
  const logs = useEvaluationLogsStore((s) => s.logs)
  const lastEvent = useEvaluationLogsStore((s) => s.lastEvent)
  const status = useEvaluationLogsStore((s) => s.status)
  const evaluationId = useEvaluationLogsStore((s) => s.evaluationId)
  const detailsUrl = useEvaluationLogsStore((s) => s.detailsUrl)
  const queryKeysToInvalidate = useEvaluationLogsStore((s) => s.queryKeysToInvalidate)
  const connect = useEvaluationLogsStore((s) => s.connect)
  const disconnect = useEvaluationLogsStore((s) => s.disconnect)
  const clearLogs = useEvaluationLogsStore((s) => s.clearLogs)

  return {
    logs,
    lastEvent,
    status,
    evaluationId,
    detailsUrl,
    queryKeysToInvalidate,
    connect,
    disconnect,
    clearLogs,
  }
}
