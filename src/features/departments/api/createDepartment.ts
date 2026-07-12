import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Department, CreateDepartmentPayload } from "../types/Department";

export default function createDepartment(
  data: CreateDepartmentPayload,
): Promise<ResponseAPI<Department>> {
  return api.post("/departments", data);
}
