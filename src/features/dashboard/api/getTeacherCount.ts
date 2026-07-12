import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

interface TeacherCountResponse {
  current_count: number;
  previous_count: number;
  department_id: number;
}

export default function getTeacherCount(
  academicPeriodId: string,
): Promise<ResponseAPI<TeacherCountResponse>> {
  return api.get(`/teachers/count?academic_period_id=${academicPeriodId}`);
}
