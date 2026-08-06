import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { AdminUser, UpdateUserPayload, UserParams } from '../types'

/** Raw request functions. Not exported — call through the hooks below. */

async function getUsers(params: UserParams): Promise<ResponseAPI<AdminUser[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.active !== undefined) query['active'] = params.active

  return api.get('/users/', { params: query })
}

async function updateUser(
  userId: number,
  payload: UpdateUserPayload,
): Promise<ResponseAPI<AdminUser>> {
  return api.put(`/users/${userId}`, payload)
}

/** Query-key factory so list invalidations stay consistent. */
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
}

/**
 * Fetches the paginated list of users (`GET /users/`) with optional
 * search and active status filters.
 *
 * @example
 * const { data, isPending } = useGetUsers({ page: 1, limit: 10, search: 'juan', active: true });
 */
export function useGetUsers({
  page = 1,
  limit = 10,
  search = '',
  active,
}: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
} = {}) {
  return useQuery({
    queryKey: [...usersKeys.lists(), { page, limit, search, active }],
    queryFn: () => getUsers({ page, limit, search, active }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Updates a user's profile (`PUT /users/{user_id}`).
 * Invalidates the users list on success.
 *
 * @example
 * const { mutate: updateUser } = useUpdateUser();
 * updateUser({ userId: 1, payload: { name: 'Juan', active: true, avatar_url: '', roles: ['DOCENTE'] } });
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UpdateUserPayload }) =>
      updateUser(userId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}
