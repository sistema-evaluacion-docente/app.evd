import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { PlanCandidates } from "../types/Plan";

export interface GetPlanCandidatesParams {
  period_id: number;
  department_id?: number;
  only_at_risk?: boolean;
  search?: string;
}

/** Teachers that can receive a plan, with the average of every dimension and item. */
export default function getPlanCandidates({
  period_id,
  department_id,
  only_at_risk,
  search,
}: GetPlanCandidatesParams): Promise<ResponseAPI<PlanCandidates>> {
  const params: Record<string, string | number | boolean> = { period_id };
  if (department_id) params.department_id = department_id;
  if (only_at_risk) params.only_at_risk = true;
  if (search) params.search = search;
  return api.get("/improvement-plans/candidates", { params });
}
