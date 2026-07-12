import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

interface EvaluationCountResponse {
  count: number;
  department_id: number;
  academic_period_id: number;
}

export default function getEvaluationCount(
  academicPeriodId: string,
): Promise<ResponseAPI<EvaluationCountResponse>> {
  return api.get("/evaluations/count", {
    params: { academic_period_id: academicPeriodId },
  });
}
