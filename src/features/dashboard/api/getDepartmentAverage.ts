import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface DepartmentAverageData {
  global_average: number | null;
  total_respondents: number;
  evaluation_count: number;
  previous_global_average: number | null;
  previous_total_respondents: number;
  previous_evaluation_count: number;
}

export default function getDepartmentAverage(
  departmentId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<DepartmentAverageData>> {
  return api.get("/stats/department-average", {
    params: {
      department_id: departmentId,
      academic_period_id: academicPeriodId,
    },
  });
}
