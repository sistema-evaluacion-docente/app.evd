import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { getToken } from '@/features/auth/api/AuthService'
import useAuth from '@/shared/hooks/useAuth'
import {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead as markAllAsReadApi,
  markAsRead as markAsReadApi,
} from '../api/NotificationService'
import type { Notification, WebSocketNotificationEvent } from '../types/Notification'

interface NotificationsContextType {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
  markAsRead: (ids: number[]) => Promise<void>
  markAllAsRead: () => Promise<void>
}

const NotificationsContext = createContext<NotificationsContextType | null>(null)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const MAX_RECONNECT_ATTEMPTS = 5

  const fetchNotifications = useCallback(async () => {
    if (!token) return

    setIsLoading(true)
    setError(null)

    try {
      const [notificationsRes, countRes] = await Promise.all([
        getMyNotifications(undefined, 1, 50),
        getUnreadCount(),
      ])

      setNotifications(notificationsRes.data || [])
      setUnreadCount(countRes.data?.unread_count || 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar notificaciones')
    } finally {
      setIsLoading(false)
    }
  }, [token])

  const markAsRead = useCallback(
    async (ids: number[]) => {
      try {
        await markAsReadApi({ ids })

        setNotifications((prev) => prev.map((n) => (ids.includes(n.id) ? { ...n, read: true } : n)))
        setUnreadCount((prev) =>
          Math.max(
            0,
            prev -
              ids.filter((id) => {
                const notification = notifications.find((n) => n.id === id)
                return notification && !notification.read
              }).length,
          ),
        )
      } catch (err) {
        console.error('Error marking notifications as read:', err)
      }
    },
    [notifications],
  )

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadApi()

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  }, [])

  useEffect(() => {
    if (!token) return

    let cancelled = false

    const load = async () => {
      if (cancelled) return

      setIsLoading(true)
      setError(null)

      try {
        const [notificationsRes, countRes] = await Promise.all([
          getMyNotifications(undefined, 1, 50),
          getUnreadCount(),
        ])

        if (cancelled) return

        setNotifications(notificationsRes.data || [])
        setUnreadCount(countRes.data?.unread_count || 0)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Error al cargar notificaciones')
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (!token) return

    const connectWebSocket = async () => {
      try {
        const firebaseToken = await getToken()

        if (!firebaseToken) return

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

        let host

        if (window.location.host.includes('localhost')) {
          host = 'localhost:8000'
        } else {
          host = window.location.host
        }

        const ws = new WebSocket(`${protocol}//${host}/api/ws/notifications?token=${firebaseToken}`)

        wsRef.current = ws

        ws.onopen = () => {
          console.log('WebSocket notifications connected')
          reconnectAttemptsRef.current = 0
        }

        ws.onmessage = (event) => {
          try {
            const data: WebSocketNotificationEvent = JSON.parse(event.data)

            if (data.type === 'notification') {
              const newNotification: Notification = {
                id: data.notification_id,
                user_id: data.user_id,
                title: data.title,
                message: data.message,
                type: data.notification_type,
                read: false,
                created_at: data.timestamp,
                updated_at: data.timestamp,
              }

              setNotifications((prev) => [newNotification, ...prev])
              setUnreadCount((prev) => prev + 1)
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err)
          }
        }

        ws.onerror = (error) => {
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          console.log('WebSocket notifications disconnected')

          if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
            console.log('Max reconnection attempts reached, giving up')
            return
          }

          reconnectAttemptsRef.current += 1
          reconnectTimeoutRef.current = setTimeout(() => {
            connectWebSocket()
          }, 5000)
        }
      } catch (err) {
        console.error('Error connecting to WebSocket:', err)
      }
    }

    connectWebSocket()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
      reconnectAttemptsRef.current = 0
    }
  }, [token])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      error,
      refetch: fetchNotifications,
      markAsRead,
      markAllAsRead,
    }),
    [notifications, unreadCount, isLoading, error, fetchNotifications, markAsRead, markAllAsRead],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
