import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { EvaluationRecord } from "./evaluationService";

interface GetEvaluationsParams {
  page: number;
  limit: number;
  search: string;
}

export default function getEvaluations({
  page = 1,
  limit = 10,
  search = "",
}: GetEvaluationsParams): Promise<ResponseAPI<EvaluationRecord[]>> {
  const params: Record<string, string | number> = {};
  if (search) params.search = search;
  return api.get("/evaluations", { params: { ...params, page, limit } });
}
