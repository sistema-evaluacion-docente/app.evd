import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

interface CommentCountResponse {
  current_count: number;
  previous_count: number;
  department_id: number;
  academic_period_id: number;
}

export default function getCommentCount(
  academicPeriodId: string,
): Promise<ResponseAPI<CommentCountResponse>> {
  return api.get("/comments/count", {
    params: { academic_period_id: academicPeriodId, risk_level: 2 },
  });
}
