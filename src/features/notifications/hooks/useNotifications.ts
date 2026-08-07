import { useAuthStore } from '@/features/auth'
import { useEffect } from 'react'

import { useNotificationsStore } from '../store'

/**
 * Exposes notifications state and actions from the notifications store,
 * and keeps the realtime WebSocket channel alive while the user is
 * authenticated.
 *
 * @example
 * const { notifications, unreadCount, markAllAsRead } = useNotifications();
 */
export function useNotifications() {
  const token = useAuthStore((s) => s.token)

  const notifications = useNotificationsStore((s) => s.notifications)
  const unreadCount = useNotificationsStore((s) => s.unreadCount)
  const isLoading = useNotificationsStore((s) => s.isLoading)
  const error = useNotificationsStore((s) => s.error)
  const refetch = useNotificationsStore((s) => s.fetchNotifications)
  const markAsRead = useNotificationsStore((s) => s.markAsRead)
  const markAllAsRead = useNotificationsStore((s) => s.markAllAsRead)

  useEffect(() => {
    if (!token) return

    void useNotificationsStore.getState().fetchNotifications()
    void useNotificationsStore.getState().connectWebSocket()

    return () => {
      useNotificationsStore.getState().disconnectWebSocket()
    }
  }, [token])

  return { notifications, unreadCount, isLoading, error, refetch, markAsRead, markAllAsRead }
}
