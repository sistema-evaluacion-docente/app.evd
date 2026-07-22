import { useCallback, useEffect, useRef, useState } from 'react'

import { API_URL } from '@/config'
import { getToken } from '@/features/auth/api/AuthService'

export const MAX_LOGS = 200

const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000

const STORAGE_KEY = 'dev-log-entries'

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export interface LogEntry {
  id: number
  timestamp: number
  message: string
  duration_ms?: number
  path?: string
}

function getWsUrl(): string {
  const url = new URL(API_URL)
  const protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'

  return `${protocol}//${url.host}/ws/devlogs`
}

interface UseDevLogWebSocketOptions {
  enabled: boolean
}

function loadLogs(): LogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as LogEntry[]) : []
  } catch {
    return []
  }
}

function saveLogs(logs: LogEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
  } catch {
    /* quota exceeded, ignore */
  }
}

export function useDevLogWebSocket({ enabled }: UseDevLogWebSocketOptions) {
  const [logs, setLogs] = useState<LogEntry[]>(loadLogs)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const logContainerRef = useRef<HTMLDivElement>(null)
  const logIdRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    let ws: WebSocket | null = null
    let reconnectTimeout: ReturnType<typeof setTimeout>
    let reconnectAttempt = 0
    let disposed = false

    const connect = async () => {
      if (disposed) return
      setStatus('connecting')

      try {
        const token = await getToken()
        if (!token) return

        const wsUrl = getWsUrl()

        ws = new WebSocket(wsUrl)

        ws.onopen = () => {
          if (disposed) {
            ws?.close()
            return
          }
          setStatus('connected')
          reconnectAttempt = 0
        }

        ws.onmessage = (event) => {
          if (disposed) return

          logIdRef.current += 1

          setLogs((prev) => {
            const next = [
              ...prev,
              {
                id: logIdRef.current,
                timestamp: Date.now(),
                message: event.data,
              },
            ]

            return next.length >= MAX_LOGS ? [] : next
          })
        }

        ws.onclose = (event) => {
          if (disposed) return
          ws = null

          if (event.code === 4003 || event.code === 1008) {
            setStatus('error')
            return
          }

          setStatus('disconnected')

          const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY)
          reconnectAttempt += 1
          reconnectTimeout = setTimeout(connect, delay)
        }

        ws.onerror = () => {}
      } catch {
        if (disposed) return

        setStatus('error')

        const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** reconnectAttempt, RECONNECT_MAX_DELAY)
        reconnectAttempt += 1
        reconnectTimeout = setTimeout(connect, delay)
      }
    }

    connect()

    return () => {
      disposed = true

      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (ws) ws.close()
    }
  }, [enabled])

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  useEffect(() => {
    saveLogs(logs)
  }, [logs])

  const clearLogs = useCallback(() => setLogs([]), [])

  return { logs, status, clearLogs, logContainerRef }
}
