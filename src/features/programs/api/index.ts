import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { CreateProgramPayload, Program, ProgramParams, UpdateProgramPayload } from '../types'

/** Raw request functions. Not exported — call through the hooks below. */

async function getPrograms(params: ProgramParams): Promise<ResponseAPI<Program[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.active !== undefined) query['active'] = params.active

  return api.get('/programs/', { params: query })
}

async function getProgramById(programId: number): Promise<ResponseAPI<Program>> {
  return api.get(`/programs/${programId}`)
}

async function createProgram(payload: CreateProgramPayload): Promise<ResponseAPI<Program>> {
  return api.post('/programs/', payload)
}

async function updateProgram(
  programId: number,
  payload: UpdateProgramPayload,
): Promise<ResponseAPI<Program>> {
  return api.put(`/programs/${programId}`, payload)
}

async function deleteProgram(programId: number): Promise<ResponseAPI<void>> {
  return api.delete(`/programs/${programId}`)
}

/** Query-key factory so list invalidations stay consistent. */
export const programsKeys = {
  all: ['programs'] as const,
  lists: () => [...programsKeys.all, 'list'] as const,
  detail: (programId: number) => [...programsKeys.all, 'detail', programId] as const,
}

/**
 * Fetches the paginated list of academic programs (`GET /programs/`) with
 * optional search and active status filters.
 *
 * @example
 * const { data, isPending } = useGetPrograms({ page: 1, limit: 10, search: 'sistemas' });
 */
export function useGetPrograms({
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
    queryKey: [...programsKeys.lists(), { page, limit, search, active }],
    queryFn: () =>
      getPrograms({
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
 * Fetches a single academic program (`GET /programs/{program_id}`).
 * Disabled until a program id is given.
 *
 * @example
 * const { data } = useGetProgramById(programId);
 */
export function useGetProgramById(programId?: number) {
  return useQuery({
    queryKey: programsKeys.detail(programId ?? 0),
    queryFn: () => getProgramById(programId as number),
    enabled: programId !== undefined,
    staleTime: 60_000,
  })
}

/**
 * Creates a new academic program (`POST /programs/`).
 * Invalidates the programs list on success.
 *
 * @example
 * const { mutate: createProgram } = useCreateProgram();
 * createProgram({ name: 'Ingeniería de Sistemas', code: 'IS' });
 */
export function useCreateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateProgramPayload) => createProgram(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programsKeys.lists() })
    },
  })
}

/**
 * Updates an academic program (`PUT /programs/{program_id}`).
 * Invalidates the programs list on success.
 *
 * @example
 * const { mutate: updateProgram } = useUpdateProgram();
 * updateProgram({ programId: 1, payload: { name: '...', code: '...', active: true } });
 */
export function useUpdateProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ programId, payload }: { programId: number; payload: UpdateProgramPayload }) =>
      updateProgram(programId, payload),
    onSuccess: (_data, { programId }) => {
      queryClient.invalidateQueries({ queryKey: programsKeys.lists() })
      queryClient.invalidateQueries({ queryKey: programsKeys.detail(programId) })
    },
  })
}

/**
 * Deletes an academic program (`DELETE /programs/{program_id}`).
 * Invalidates the programs list on success.
 *
 * @example
 * const { mutate: deleteProgram } = useDeleteProgram();
 * deleteProgram(1);
 */
export function useDeleteProgram() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (programId: number) => deleteProgram(programId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programsKeys.lists() })
    },
  })
}
