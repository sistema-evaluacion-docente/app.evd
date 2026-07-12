import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface StatItem {
  department_id: number;
  department_name: string;
  department_code: string;
  academic_period_id: number;
  academic_period_code: string;
  academic_period_name: string;
  global_average: number | null;
  total_respondents: number;
  evaluation_count: number;
}

export default function getStats(
  departmentId?: number,
): Promise<ResponseAPI<StatItem[]>> {
  return api.get("/stats/", {
    params: departmentId ? { department_id: departmentId } : {},
  });
}
