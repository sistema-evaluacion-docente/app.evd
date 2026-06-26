import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Department, UpdateDepartmentPayload } from "../types/Department";

export default function updateDepartment({
  id,
  ...data
}: UpdateDepartmentPayload & { id: number }): Promise<
  ResponseAPI<Department>
> {
  return api.put(`/departments/${id}`, data);
}
