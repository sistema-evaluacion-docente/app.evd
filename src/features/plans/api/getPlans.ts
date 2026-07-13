import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Plan } from "../types/Plan";

export interface GetPlansParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  period_id?: number;
  department_id?: number;
}

export default function getPlans({
  page = 1,
  limit = 10,
  search = "",
  status = "",
  period_id,
  department_id,
}: GetPlansParams): Promise<ResponseAPI<Plan[]>> {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  if (status && status !== "todos") params.status = status;
  if (period_id) params.period_id = period_id;
  if (department_id) params.department_id = department_id;
  return api.get("/improvement-plans/", { params });
}
