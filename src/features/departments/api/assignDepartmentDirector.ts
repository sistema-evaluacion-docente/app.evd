import api from "@/config/axios";

/**
 * Assigns a director to a department by making a POST request to the API.
 *
 * @param departmentId The ID of the department to which the director will be assigned.
 * @param userId The ID of the user who will be assigned as the director of the department.
 * @returns A promise that resolves when the assignment is successful.
 */
export default function assignDepartmentDirector({
  departmentId,
  userId,
}: {
  departmentId: number;
  userId: number;
}) {
  return api.post(`/departments/${departmentId}/director`, {
    user_id: userId,
  });
}
