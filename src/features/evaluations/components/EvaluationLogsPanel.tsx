import { FloatingLogs, type LogEntry } from '@/components/common/FloatingLogs'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import { ExternalLink } from 'lucide-react'
import { useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { Link } from 'wouter'

import { useEvaluationLogs } from '../hooks/useEvaluationLogs'
import type { EvaluationLogEvent } from '../types'

function toLogEntry(event: EvaluationLogEvent, index: number): LogEntry {
  const meta = [event.teacher_name, event.course_name].filter(Boolean).join(' • ')

  return {
    id: `${event.evaluation_id}-${event.timestamp}-${index}`,
    level: event.level,
    message: event.message,
    meta: meta || undefined,
  }
}

/**
 * Global container that mirrors the evaluation logs store into the floating
 * log panel, fires toasts on completion/failure, and invalidates React Query
 * keys once a processing run finishes. Renders nothing while no logs exist.
 *
 * @example
 * <EvaluationLogsPanel />
 */
export function EvaluationLogsPanel() {
  const queryClient = useQueryClient()
  const { logs, lastEvent, detailsUrl, queryKeysToInvalidate, clearLogs } = useEvaluationLogs()

  useEffect(() => {
    if (!lastEvent) return

    if (lastEvent.stage === 'UPLOADING') {
      if (lastEvent.status === 'COMPLETED' && lastEvent.count) {
        toast.success(`Evaluación procesada: ${lastEvent.count} docentes`)
      } else if (lastEvent.status === 'FAILED') {
        toast.error('Error al procesar la evaluación')
      }
    } else if (lastEvent.stage === 'ANALYZING') {
      if (lastEvent.status === 'COMPLETED') {
        toast.success('Análisis de comentarios completado')
      } else if (lastEvent.status === 'FAILED') {
        toast.error('Error al analizar los comentarios')
      }
    }
  }, [lastEvent])

  const isFinished = lastEvent?.status === 'COMPLETED' || lastEvent?.status === 'FAILED'

  useEffect(() => {
    if (!isFinished || queryKeysToInvalidate.length === 0) return

    for (const key of queryKeysToInvalidate) {
      queryClient.invalidateQueries({ queryKey: key })
    }
  }, [isFinished, queryKeysToInvalidate, queryClient])

  const entries = useMemo(() => logs.map(toLogEntry), [logs])

  return (
    <FloatingLogs
      logs={entries}
      title="Evaluación"
      isFinished={isFinished}
      onClear={clearLogs}
      footer={
        detailsUrl ? (
          <Link href={detailsUrl} className="block w-full" target="_blank">
            <Button size="sm" variant="outline" className="w-full justify-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" />
              Ir a ver detalles
            </Button>
          </Link>
        ) : undefined
      }
    />
  )
}
