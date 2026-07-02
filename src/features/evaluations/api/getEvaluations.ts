import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { EvaluationRecord } from "./evaluationService";

interface GetEvaluationsParams {
  page: number;
  limit: number;
  search: string;
  period_id?: string;
  department_id?: number;
}

export default function getEvaluations({
  page = 1,
  limit = 10,
  search = "",
  period_id,
  department_id,
}: GetEvaluationsParams): Promise<ResponseAPI<EvaluationRecord[]>> {
  const params: Record<string, string | number> = {};
  if (search) params.search = search;
  if (period_id) params.period_id = period_id;
  if (department_id) params.department_id = department_id;
  return api.get("/evaluations", { params: { ...params, page, limit } });
}
