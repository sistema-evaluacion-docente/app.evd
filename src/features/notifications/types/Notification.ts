export type NotificationType = 'info' | 'warning' | 'error' | 'success'

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

export interface NotificationFilters {
  type?: NotificationType
  read?: boolean
  search?: string
}

export interface NotificationMarkRead {
  ids: number[]
}

export interface WebSocketNotificationEvent {
  type: 'notification'
  timestamp: string
  notification_id: number
  user_id: number
  title: string
  message: string
  notification_type: NotificationType
}
