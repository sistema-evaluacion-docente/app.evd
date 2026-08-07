import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { Notification, NotificationFilters, NotificationMarkRead } from '../types/Notification'

/** Raw request functions. Not exported — call through the store/actions below. */

async function getMyNotifications(
  filters?: NotificationFilters,
  page = 1,
  limit = 10,
): Promise<ResponseAPI<Notification[]>> {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.read !== undefined) params.append('read', String(filters.read))
  if (filters?.search) params.append('search', filters.search)

  params.append('page', String(page))
  params.append('limit', String(limit))

  return api.get(`/notifications/me?${params.toString()}`)
}

async function getUnreadCount(): Promise<ResponseAPI<{ unread_count: number }>> {
  return api.get('/notifications/me/unread-count')
}

async function markAsRead(
  payload: NotificationMarkRead,
): Promise<ResponseAPI<{ updated: number }>> {
  return api.put('/notifications/me/read', payload)
}

async function markAllAsRead(): Promise<ResponseAPI<{ updated: number }>> {
  return api.put('/notifications/me/read-all')
}

/** Raw request functions shared with the notifications store. Not part of the public API. */
export {
  getMyNotifications,
  getUnreadCount,
  markAllAsRead as markAllAsReadApi,
  markAsRead as markAsReadApi,
}
