import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'

import { FloatingLogs } from '../components/FloatingLogs'
import { useEvaluationWebSocket } from '../hooks/useEvaluationWebSocket'

interface EvaluationLogsContextValue {
  connect: (evaluationId: number) => void
  disconnect: () => void
  clearLogs: () => void
}

const EvaluationLogsContext = createContext<EvaluationLogsContextValue | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export function useEvaluationLogsContext() {
  const ctx = useContext(EvaluationLogsContext)
  if (!ctx) throw new Error('useEvaluationLogsContext must be used within EvaluationLogsProvider')
  return ctx
}

export function EvaluationLogsProvider({ children }: { children: ReactNode }) {
  const [evaluationId, setEvaluationId] = useState<number | null>(null)
  const [enabled, setEnabled] = useState(false)

  const { lastEvent, logs, clearLogs } = useEvaluationWebSocket({
    evaluationId,
    enabled,
  })

  const connect = useCallback((id: number) => {
    setEvaluationId(id)
    setEnabled(true)
  }, [])

  const disconnect = useCallback(() => {
    setEnabled(false)
    setEvaluationId(null)
  }, [])

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

  return (
    <EvaluationLogsContext.Provider value={{ connect, disconnect, clearLogs }}>
      {children}
      <FloatingLogs
        logs={logs}
        onClear={clearLogs}
        isFinished={lastEvent?.status === 'COMPLETED' || lastEvent?.status === 'FAILED'}
      />
    </EvaluationLogsContext.Provider>
  )
}
