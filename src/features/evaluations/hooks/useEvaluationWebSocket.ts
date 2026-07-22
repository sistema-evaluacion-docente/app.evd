import { useCallback, useEffect, useRef, useState } from 'react'

import { API_URL } from '@/config'
import { getToken } from '@/features/auth/api/AuthService'

export type WsConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface EvaluationProgressEvent {
  type: 'evaluation_progress'
  evaluation_id: number
  stage: 'UPLOADING' | 'ANALYZING'
  status?: string
  ai_status?: string
  count?: number
  timestamp: string
}

export interface EvaluationLogEvent {
  type: 'evaluation_log'
  evaluation_id: number
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  teacher_name?: string
  teacher_code?: string
  course_name?: string
  course_code?: string
  timestamp: string
}

export type EvaluationWsEvent = EvaluationProgressEvent | EvaluationLogEvent

const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000

function getWsUrl(evaluationId: number): string {
  const url = new URL(API_URL)
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return `${protocol}//${url.host}/ws/evaluations/${evaluationId}`
}

interface UseEvaluationWebSocketOptions {
  evaluationId: number | null
  enabled: boolean
}

/**
 * Custom hook to manage a WebSocket connection for receiving real-time evaluation progress and log events.
 *
 * @param {UseEvaluationWebSocketOptions} options - The options for the WebSocket connection.
 * @returns {object} An object containing the connection status, last event, logs, and control functions.
 */
export function useEvaluationWebSocket({ evaluationId, enabled }: UseEvaluationWebSocketOptions) {
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected')
  const [lastEvent, setLastEvent] = useState<EvaluationProgressEvent | null>(null)
  const [logs, setLogs] = useState<EvaluationLogEvent[]>([])
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const reconnectAttemptRef = useRef(0)
  const disposedRef = useRef(false)

  useEffect(() => {
    if (!enabled || !evaluationId) return

    disposedRef.current = false

    const connect = async () => {
      if (disposedRef.current || !evaluationId) return

      setStatus('connecting')

      try {
        const token = await getToken()
        if (!token) {
          setStatus('error')
          return
        }

        const wsUrl = `${getWsUrl(evaluationId)}?token=${token}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
          if (disposedRef.current) {
            ws.close()
            return
          }
          setStatus('connected')
          reconnectAttemptRef.current = 0
        }

        ws.onmessage = (event) => {
          if (disposedRef.current) return

          try {
            const data = JSON.parse(event.data) as EvaluationWsEvent

            if (data.type === 'evaluation_progress') {
              setLastEvent(data)
            } else if (data.type === 'evaluation_log') {
              setLogs((prev) => [...prev, data])
            }
          } catch {
            console.error('Failed to parse WebSocket message')
          }
        }

        ws.onclose = (event) => {
          if (disposedRef.current) return
          wsRef.current = null

          if (event.code === 4001 || event.code === 4003) {
            setStatus('error')
            return
          }

          setStatus('disconnected')

          const delay = Math.min(
            RECONNECT_BASE_DELAY * 2 ** reconnectAttemptRef.current,
            RECONNECT_MAX_DELAY,
          )
          reconnectAttemptRef.current += 1
          reconnectTimeoutRef.current = setTimeout(connect, delay)
        }

        ws.onerror = () => {
          if (disposedRef.current) return
          setStatus('error')
        }
      } catch {
        if (disposedRef.current) return

        setStatus('error')

        const delay = Math.min(
          RECONNECT_BASE_DELAY * 2 ** reconnectAttemptRef.current,
          RECONNECT_MAX_DELAY,
        )
        reconnectAttemptRef.current += 1
        reconnectTimeoutRef.current = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      disposedRef.current = true

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
    }
  }, [enabled, evaluationId])

  const disconnect = useCallback(() => {
    disposedRef.current = true

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }

    setStatus('disconnected')
  }, [])

  const clearLogs = useCallback(() => {
    setLogs([])
  }, [])

  return {
    status,
    lastEvent,
    logs,
    disconnect,
    clearLogs,
  }
}
