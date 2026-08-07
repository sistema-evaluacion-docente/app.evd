import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ResponseAPI } from '@/@types/Response'
import api from '@/config/axios'
import type {
  CreateDepartmentPayload,
  Department,
  DepartmentParams,
  UpdateDepartmentPayload,
} from '../types'

/** Raw request functions. Not exported — call through the hooks below. */

async function getDepartments(params: DepartmentParams): Promise<ResponseAPI<Department[]>> {
  const query: Record<string, unknown> = { page: params.page, limit: params.limit }

  if (params.search) query['search'] = params.search
  if (params.active !== undefined) query['active'] = params.active
  if (params.faculty_id) query['faculty_id'] = params.faculty_id

  return api.get('/departments/', { params: query })
}

async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<ResponseAPI<Department>> {
  return api.post('/departments/', payload)
}

async function updateDepartment(
  departmentId: number,
  payload: UpdateDepartmentPayload,
): Promise<ResponseAPI<Department>> {
  return api.put(`/departments/${departmentId}`, payload)
}

async function deleteDepartment(departmentId: number): Promise<ResponseAPI<void>> {
  return api.delete(`/departments/${departmentId}`)
}

async function assignDirector(
  departmentId: number,
  payload: { user_id: number },
): Promise<ResponseAPI<void>> {
  return api.post(`/departments/${departmentId}/director`, payload)
}

async function unassignDirector(departmentId: number): Promise<ResponseAPI<void>> {
  return api.delete(`/departments/${departmentId}/director`)
}

/** Query-key factory so list invalidations stay consistent. */
export const departmentsKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentsKeys.all, 'list'] as const,
}

/**
 * Fetches the paginated list of departments (`GET /departments/`) with optional
 * search, active status, and faculty filters.
 *
 * @example
 * const { data, isPending } = useGetDepartments({ page: 1, limit: 10, facultyId: 1 });
 */
export function useGetDepartments({
  page = 1,
  limit = 10,
  search = '',
  active,
  facultyId,
}: {
  page?: number
  limit?: number
  search?: string
  active?: boolean
  facultyId?: number
} = {}) {
  return useQuery({
    queryKey: [...departmentsKeys.lists(), { page, limit, search, active, facultyId }],
    queryFn: () =>
      getDepartments({
        page,
        limit,
        search,
        active,
        faculty_id: facultyId,
      }),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })
}

/**
 * Creates a new department record (`POST /departments/`).
 * Invalidates the departments list on success.
 *
 * @example
 * const { mutate: createDepartment } = useCreateDepartment();
 * createDepartment({ name: 'Sistemas', code: 'SIS', faculty_id: 1 });
 */
export function useCreateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => createDepartment(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.lists() })
    },
  })
}

/**
 * Updates a department record (`PUT /departments/{department_id}`).
 * Invalidates the departments list on success.
 *
 * @example
 * const { mutate: updateDepartment } = useUpdateDepartment();
 * updateDepartment({ departmentId: 1, payload: { name: '...', code: '...', faculty_id: 1, active: true } });
 */
export function useUpdateDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      departmentId,
      payload,
    }: {
      departmentId: number
      payload: UpdateDepartmentPayload
    }) => updateDepartment(departmentId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.lists() })
    },
  })
}

/**
 * Deletes a department record (`DELETE /departments/{department_id}`).
 * Invalidates the departments list on success.
 *
 * @example
 * const { mutate: deleteDepartment } = useDeleteDepartment();
 * deleteDepartment(1);
 */
export function useDeleteDepartment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (departmentId: number) => deleteDepartment(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.lists() })
    },
  })
}

/**
 * Assigns a user as director of a department (`POST /departments/{department_id}/director`).
 * Invalidates the departments list on success.
 *
 * @example
 * const { mutate: assignDirector } = useAssignDirector();
 * assignDirector({ departmentId: 1, userId: 12 });
 */
export function useAssignDirector() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ departmentId, userId }: { departmentId: number; userId: number }) =>
      assignDirector(departmentId, { user_id: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.lists() })
    },
  })
}

/**
 * Unassigns the director of a department (`DELETE /departments/{department_id}/director`).
 * Invalidates the departments list on success.
 *
 * @example
 * const { mutate: unassignDirector } = useUnassignDirector();
 * unassignDirector(1);
 */
export function useUnassignDirector() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (departmentId: number) => unassignDirector(departmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentsKeys.lists() })
    },
  })
}
