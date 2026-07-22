import api from '@/config/axios'

/**
 * Unassigns the director of a department.
 *
 * @param departmentId - The ID of the department from which to unassign the director.
 * @returns A promise that resolves when the director is successfully unassigned.
 */
export default function unassignDepartmentDirector({ departmentId }: { departmentId: number }) {
  return api.delete(`/departments/${departmentId}/director`)
}
