import { getToken, useAuthStore } from '@/features/auth'
import { create } from 'zustand'

import { getMyNotifications, getUnreadCount, markAllAsReadApi, markAsReadApi } from '../api'
import type { Notification, WebSocketNotificationEvent } from '../types/Notification'

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY_MS = 5000

let wsRef: WebSocket | null = null
let connectingRef = false
let fetchingRef = false
let reconnectTimeoutRef: ReturnType<typeof setTimeout> | null = null
let reconnectAttemptsRef = 0

interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  fetchNotifications: () => Promise<void>
  markAsRead: (ids: number[]) => Promise<void>
  markAllAsRead: () => Promise<void>
  connectWebSocket: () => Promise<void>
  disconnectWebSocket: () => void
}

function buildWebSocketUrl(firebaseToken: string): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'

  let host: string

  if (window.location.host.includes('localhost')) {
    host = 'localhost:8000'
  } else {
    host = window.location.host + '/api'
  }

  return `${protocol}//${host}/ws/notifications?token=${firebaseToken}`
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    if (!useAuthStore.getState().token) return

    if (fetchingRef) return

    fetchingRef = true
    set({ isLoading: true, error: null })

    try {
      const [notificationsRes, countRes] = await Promise.all([
        getMyNotifications(undefined, 1, 50),
        getUnreadCount(),
      ])

      set({
        notifications: notificationsRes.data || [],
        unreadCount: countRes.data?.unread_count || 0,
      })
    } catch (err) {
      set({ error: err instanceof Error ? err.message : 'Error al cargar notificaciones' })
    } finally {
      fetchingRef = false
      set({ isLoading: false })
    }
  },

  markAsRead: async (ids) => {
    try {
      await markAsReadApi({ ids })

      set((state) => {
        const unreadMarked = ids.filter((id) => {
          const notification = state.notifications.find((n) => n.id === id)
          return notification && !notification.read
        }).length

        return {
          notifications: state.notifications.map((n) =>
            ids.includes(n.id) ? { ...n, read: true } : n,
          ),
          unreadCount: Math.max(0, state.unreadCount - unreadMarked),
        }
      })
    } catch (err) {
      console.error('Error marking notifications as read:', err)
    }
  },

  markAllAsRead: async () => {
    try {
      await markAllAsReadApi()

      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch (err) {
      console.error('Error marking all notifications as read:', err)
    }
  },

  connectWebSocket: async () => {
    if (wsRef || connectingRef) return

    connectingRef = true

    void get().fetchNotifications()

    try {
      const firebaseToken = await getToken()

      if (!firebaseToken) return

      if (wsRef) return

      const ws = new WebSocket(buildWebSocketUrl(firebaseToken))

      wsRef = ws

      ws.onopen = () => {
        reconnectAttemptsRef = 0
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

            set((state) => {
              if (state.notifications.some((n) => n.id === data.notification_id)) {
                return state
              }

              return {
                notifications: [newNotification, ...state.notifications],
                unreadCount: state.unreadCount + 1,
              }
            })
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err)
        }
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
      }

      ws.onclose = () => {
        wsRef = null

        if (reconnectAttemptsRef >= MAX_RECONNECT_ATTEMPTS) {
          console.log('Max reconnection attempts reached, giving up')
          return
        }

        reconnectAttemptsRef += 1
        reconnectTimeoutRef = setTimeout(() => {
          connectingRef = false
          get().connectWebSocket()
        }, RECONNECT_DELAY_MS)
      }
    } catch (err) {
      console.error('Error connecting to WebSocket:', err)
    } finally {
      connectingRef = false
    }
  },

  disconnectWebSocket: () => {
    if (reconnectTimeoutRef) {
      clearTimeout(reconnectTimeoutRef)
      reconnectTimeoutRef = null
    }

    if (wsRef) {
      wsRef.close()
      wsRef = null
    }

    reconnectAttemptsRef = 0
  },
}))
