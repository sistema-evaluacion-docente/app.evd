import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type { AdminUser, CreateUserPayload, UpdateUserPayload, UserParams } from '../types'

/** Raw request functions. Not exported — call through the hooks below. */

async function getUsers(params: UserParams): Promise<ResponseAPI<AdminUser[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.active !== undefined) query['active'] = params.active
  if (params.roles?.length) query['roles'] = params.roles
  if (params.department_id != null) query['department_id'] = params.department_id

  return api.get('/users/', {
    params: query,
    paramsSerializer: { indexes: null },
  })
}

async function createUser(payload: CreateUserPayload): Promise<ResponseAPI<AdminUser>> {
  return api.post('/users/', payload)
}

/**
 * Full detail of one user, including the department and faculty that the
 * list endpoint leaves out. By numeric `id`, so it works without a `uid`.
 */
async function getUserById(id: number): Promise<ResponseAPI<AdminUser>> {
  return api.get(`/users/by-id/${id}`)
}

/** Edits any user in a single request (`PUT /users/by-id/{id}`, ADMIN only). */
async function updateUser(id: number, payload: UpdateUserPayload): Promise<ResponseAPI<AdminUser>> {
  return api.put(`/users/by-id/${id}`, payload)
}

/** Query-key factory so list invalidations stay consistent. */
export const usersKeys = {
  all: ['users'] as const,
  lists: () => [...usersKeys.all, 'list'] as const,
  detail: (id: number) => [...usersKeys.all, 'detail', id] as const,
}

/**
 * Fetches one user's full detail (`GET /users/by-id/{id}`). Idle until an
 * `id` is given, so it can back an edit drawer that opens on demand.
 *
 * @example
 * const { data } = useGetUserById(editTarget?.id);
 */
export function useGetUserById(id?: number) {
  return useQuery({
    queryKey: usersKeys.detail(id ?? 0),
    queryFn: () => getUserById(id!),
    enabled: id != null,
  })
}

/**
 * Fetches the paginated list of users (`GET /users/`) with optional
 * search, active status, roles and department filters.
 *
 * @example
 * const { data, isPending } = useGetUsers({ page: 1, limit: 10, search: 'juan', active: true, roles: ['DOCENTE'] });
 */
export function useGetUsers({
  page = 1,
  limit = 10,
  search = '',
  active,
  roles,
  departmentId,
}: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
  roles?: string[]
  /** Users who teach in or direct this department. */
  departmentId?: number
} = {}) {
  return useQuery({
    queryKey: [...usersKeys.lists(), { page, limit, search, active, roles, departmentId }],
    queryFn: () => getUsers({ page, limit, search, active, roles, department_id: departmentId }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Edits a user's name, email, code, roles, status and teacher department
 * (`PUT /users/by-id/{id}`). Invalidates the list and that user's detail.
 *
 * @example
 * const { mutate: updateUser } = useUpdateUser();
 * updateUser({ id: 5, payload: { name: 'Juan', email: 'juan@ufps.edu.co', institutional_code: '115', roles: ['DOCENTE'], active: true } });
 */
export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserPayload }) =>
      updateUser(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
      queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) })
    },
  })
}

/**
 * Creates a new user (`POST /users/`).
 * Invalidates the users list on success.
 *
 * @example
 * const { mutate: createUser } = useCreateUser();
 * createUser({ uid: 'abc123', email: 'juan@universidad.edu', name: 'Juan', active: true, avatar_url: '', institutional_code: 'DOC-001', contract_type: 'Tiempo completo', department_id: 1, roles: ['DOCENTE'] });
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateUserPayload) => createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.lists() })
    },
  })
}
