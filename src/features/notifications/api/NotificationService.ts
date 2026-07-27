import api from '@/config/axios'
import type { ResponseAPI } from '@/shared/types/Response'
import type { Notification, NotificationFilters, NotificationMarkRead } from '../types/Notification'

/**
 * Fetches the notifications for the current user with optional filters and pagination.
 *
 * @param {NotificationFilters} [filters] - Optional filters to apply to the notifications query.
 * @param {number} [page=1] - The page number for pagination (default is 1).
 * @param {number} [limit=10] - The number of notifications per page (default is 10).
 * @returns {Promise<ResponseAPI<Notification[]>>} A promise that resolves to the API response containing the notifications.
 */
export const getMyNotifications = async (
  filters?: NotificationFilters,
  page = 1,
  limit = 10,
): Promise<ResponseAPI<Notification[]>> => {
  const params = new URLSearchParams()

  if (filters?.type) params.append('type', filters.type)
  if (filters?.read !== undefined) params.append('read', String(filters.read))
  if (filters?.search) params.append('search', filters.search)

  params.append('page', String(page))
  params.append('limit', String(limit))

  return api.get(`/notifications/me?${params.toString()}`)
}

/**
 * Fetches the count of unread notifications for the current user.
 *
 * @returns {Promise<ResponseAPI<{ unread_count: number }>>} A promise that resolves to the API response containing the unread count.
 */
export const getUnreadCount = async (): Promise<ResponseAPI<{ unread_count: number }>> => {
  return api.get('/notifications/me/unread-count')
}

/**
 * Marks the specified notifications as read for the current user.
 *
 * @param {NotificationMarkRead} payload - An object containing the IDs of the notifications to mark as read.
 * @returns {Promise<ResponseAPI<{ updated: number }>>} A promise that resolves to the API response indicating the number of notifications updated.
 */
export const markAsRead = async (
  payload: NotificationMarkRead,
): Promise<ResponseAPI<{ updated: number }>> => {
  return api.put('/notifications/me/read', payload)
}

/**
 * Marks all notifications as read for the current user.
 *
 * @returns {Promise<ResponseAPI<{ updated: number }>>} A promise that resolves to the API response indicating the number of notifications updated.
 */

export const markAllAsRead = async (): Promise<ResponseAPI<{ updated: number }>> => {
  return api.put('/notifications/me/read-all')
}
