import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { AtRiskTeacher } from "../types/Plan";

export interface GetAtRiskParams {
  period_id: number;
  department_id?: number;
}

export default function getAtRiskTeachers({
  period_id,
  department_id,
}: GetAtRiskParams): Promise<ResponseAPI<AtRiskTeacher[]>> {
  const params: Record<string, string | number> = { period_id };
  if (department_id) params.department_id = department_id;
  return api.get("/improvement-plans/at-risk", { params });
}
