import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { CreateFacultyPayload, Faculty, FacultyParams, UpdateFacultyPayload } from '../types'

/** Raw request functions. Not exported — call through the hooks below. */

async function getFaculties(params: FacultyParams): Promise<ResponseAPI<Faculty[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.active !== undefined) query['active'] = params.active

  return api.get('/faculties/', { params: query })
}

async function createFaculty(payload: CreateFacultyPayload): Promise<ResponseAPI<Faculty>> {
  return api.post('/faculties/', payload)
}

async function updateFaculty(
  facultyId: number,
  payload: UpdateFacultyPayload,
): Promise<ResponseAPI<Faculty>> {
  return api.put(`/faculties/${facultyId}`, payload)
}

async function deleteFaculty(facultyId: number): Promise<ResponseAPI<void>> {
  return api.delete(`/faculties/${facultyId}`)
}

/** Query-key factory so list invalidations stay consistent. */
export const facultiesKeys = {
  all: ['faculties'] as const,
  lists: () => [...facultiesKeys.all, 'list'] as const,
}

/**
 * Fetches the paginated list of faculties (`GET /faculties/`) with optional
 * search and active status filters.
 *
 * @example
 * const { data, isPending } = useGetFaculties({ page: 1, limit: 10, search: 'ingeniería' });
 */
export function useGetFaculties({
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
    queryKey: [...facultiesKeys.lists(), { page, limit, search, active }],
    queryFn: () =>
      getFaculties({
        page,
        limit,
        search,
        active,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Creates a new faculty record (`POST /faculties/`).
 * Invalidates the faculties list on success.
 *
 * @example
 * const { mutate: createFaculty } = useCreateFaculty();
 * createFaculty({ name: 'Ingeniería', code: 'ING' });
 */
export function useCreateFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateFacultyPayload) => createFaculty(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultiesKeys.lists() })
    },
  })
}

/**
 * Updates a faculty record (`PUT /faculties/{faculty_id}`).
 * Invalidates the faculties list on success.
 *
 * @example
 * const { mutate: updateFaculty } = useUpdateFaculty();
 * updateFaculty({ facultyId: 1, payload: { name: '...', code: '...', active: true } });
 */
export function useUpdateFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ facultyId, payload }: { facultyId: number; payload: UpdateFacultyPayload }) =>
      updateFaculty(facultyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultiesKeys.lists() })
    },
  })
}

/**
 * Deletes a faculty record (`DELETE /faculties/{faculty_id}`).
 * Invalidates the faculties list on success.
 *
 * @example
 * const { mutate: deleteFaculty } = useDeleteFaculty();
 * deleteFaculty(1);
 */
export function useDeleteFaculty() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (facultyId: number) => deleteFaculty(facultyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: facultiesKeys.lists() })
    },
  })
}
