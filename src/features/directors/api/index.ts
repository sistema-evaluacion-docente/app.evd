import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { Director, DirectorParams } from '../types'

/** Raw request functions. Not exported — call through the hooks below. */

async function getDirectors(params: DirectorParams): Promise<ResponseAPI<Director[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.active !== undefined) query['active'] = params.active

  return api.get('/directors/', { params: query })
}

async function deleteDirector(directorId: number): Promise<ResponseAPI<Director>> {
  return api.delete(`/directors/${directorId}`)
}

/** Query-key factory so list invalidations stay consistent. */
export const directorsKeys = {
  all: ['directors'] as const,
  lists: () => [...directorsKeys.all, 'list'] as const,
}

/**
 * Fetches the paginated list of directors (`GET /directors/`) with optional
 * search and active status filters.
 *
 * @example
 * const { data, isPending } = useGetDirectors({ page: 1, limit: 10, search: 'maría', active: true });
 */
export function useGetDirectors({
  page = 1,
  limit = 10,
  search = '',
  active,
  enabled = true,
}: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
  enabled?: boolean
} = {}) {
  return useQuery({
    queryKey: [...directorsKeys.lists(), { page, limit, search, active }],
    queryFn: () => getDirectors({ page, limit, search, active }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
    enabled,
  })
}

/**
 * Deletes a director record (`DELETE /directors/{director_id}`).
 * Invalidates the directors list on success.
 *
 * @example
 * const { mutate: deleteDirector } = useDeleteDirector();
 * deleteDirector(3);
 */
export function useDeleteDirector() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (directorId: number) => deleteDirector(directorId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: directorsKeys.lists() })
    },
  })
}
