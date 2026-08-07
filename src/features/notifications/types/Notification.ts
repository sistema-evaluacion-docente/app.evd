export type NotificationType = 'info' | 'warning' | 'error' | 'success'

/** A single notification delivered to the authenticated user. */
export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: NotificationType
  read: boolean
  created_at: string
  updated_at: string
}

/** Filters applied to the notifications list request. */
export interface NotificationFilters {
  type?: NotificationType
  read?: boolean
  search?: string
}

/** Payload for marking specific notifications as read. */
export interface NotificationMarkRead {
  ids: number[]
}

/** Shape of the realtime notification pushed over the WebSocket channel. */
export interface WebSocketNotificationEvent {
  type: 'notification'
  timestamp: string
  notification_id: number
  user_id: number
  title: string
  message: string
  notification_type: NotificationType
}
