import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Department } from "../types/Department";

export default function getDepartments({
  page = 1,
  limit = 10,
  search
}: {
  page?: number,
  limit?: number,
  search?: string
}): Promise<ResponseAPI<Department[]>> {
  return api.get("/departments", {
    params: { page, limit, search }
  });
}
