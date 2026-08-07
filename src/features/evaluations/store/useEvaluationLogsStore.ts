import { getToken } from '@/features/auth'
import { create } from 'zustand'

import type {
  EvaluationLogEvent,
  EvaluationProgressEvent,
  EvaluationWsEvent,
  WsConnectionStatus,
} from '../types'

const RECONNECT_BASE_DELAY = 1000
const RECONNECT_MAX_DELAY = 30000

let wsRef: WebSocket | null = null
let connectingRef = false
let reconnectTimeoutRef: ReturnType<typeof setTimeout> | null = null
let reconnectAttemptRef = 0

interface EvaluationLogsState {
  logs: EvaluationLogEvent[]
  lastEvent: EvaluationProgressEvent | null
  status: WsConnectionStatus
  evaluationId: number | null
  detailsUrl?: string
  queryKeysToInvalidate: readonly (readonly unknown[])[]
  connect: (options: {
    evaluationId: number
    queryKeysToInvalidate?: readonly (readonly unknown[])[]
    detailsUrl?: string
  }) => void
  disconnect: () => void
  clearLogs: () => void
}

function buildWebSocketUrl(evaluationId: number, token: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  let host: string

  if (window.location.host.includes('localhost')) {
    host = 'localhost:8000'
  } else {
    host = window.location.host + '/api'
  }

  return `${protocol}//${host}/ws/evaluations/${evaluationId}?token=${token}`
}

function getReconnectDelay(): number {
  const delay = Math.min(RECONNECT_BASE_DELAY * 2 ** reconnectAttemptRef, RECONNECT_MAX_DELAY)
  reconnectAttemptRef += 1
  return delay
}

export const useEvaluationLogsStore = create<EvaluationLogsState>((set, get) => ({
  logs: [],
  lastEvent: null,
  status: 'disconnected',
  evaluationId: null,
  detailsUrl: undefined,
  queryKeysToInvalidate: [],

  connect: ({ evaluationId, queryKeysToInvalidate = [], detailsUrl }) => {
    get().disconnect()

    set({
      logs: [],
      lastEvent: null,
      evaluationId,
      detailsUrl,
      queryKeysToInvalidate,
      status: 'connecting',
    })

    void connectWebSocket(evaluationId)
  },

  disconnect: () => {
    if (reconnectTimeoutRef) {
      clearTimeout(reconnectTimeoutRef)
      reconnectTimeoutRef = null
    }

    if (wsRef) {
      const ws = wsRef
      wsRef = null
      ws.close()
    }

    reconnectAttemptRef = 0
    connectingRef = false

    set({ evaluationId: null, status: 'disconnected' })
  },

  clearLogs: () => set({ logs: [] }),
}))

async function connectWebSocket(evaluationId: number) {
  if (wsRef || connectingRef) return

  connectingRef = true

  try {
    const token = await getToken()

    if (!token) return

    if (wsRef) return

    const ws = new WebSocket(buildWebSocketUrl(evaluationId, token))

    wsRef = ws

    ws.onopen = () => {
      if (wsRef !== ws) return

      reconnectAttemptRef = 0
      useEvaluationLogsStore.setState({ status: 'connected' })
    }

    ws.onmessage = (event) => {
      if (wsRef !== ws) return

      try {
        const data: EvaluationWsEvent = JSON.parse(event.data)

        if (data.type === 'evaluation_progress') {
          useEvaluationLogsStore.setState({ lastEvent: data })
        } else if (data.type === 'evaluation_log') {
          useEvaluationLogsStore.setState((state) => {
            if (
              state.logs.some(
                (log) => log.timestamp === data.timestamp && log.message === data.message,
              )
            ) {
              return state
            }

            return { logs: [...state.logs, data] }
          })
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err)
      }
    }

    ws.onerror = (error) => {
      if (wsRef !== ws) return

      console.error('WebSocket error:', error)
      useEvaluationLogsStore.setState({ status: 'error' })
    }

    ws.onclose = (event) => {
      if (wsRef !== ws) return

      wsRef = null

      if (event.code === 4001 || event.code === 4003) {
        useEvaluationLogsStore.setState({ status: 'error' })
        return
      }

      useEvaluationLogsStore.setState({ status: 'disconnected' })

      reconnectTimeoutRef = setTimeout(() => {
        connectingRef = false
        void connectWebSocket(evaluationId)
      }, getReconnectDelay())
    }
  } catch (err) {
    console.error('Error connecting to WebSocket:', err)
  } finally {
    connectingRef = false
  }
}
