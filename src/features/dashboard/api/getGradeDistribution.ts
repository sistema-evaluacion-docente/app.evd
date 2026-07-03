import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface GradeDistributionBin {
  range_label: string;
  min_score: number;
  max_score: number;
  teacher_count: number;
}

export interface GradeDistributionData {
  academic_period_id: number | null;
  academic_period_code: string | null;
  academic_period_name: string | null;
  department_id: number | null;
  bins: GradeDistributionBin[];
}

export default function getGradeDistribution(
  academicPeriodId?: number,
  departmentId?: number,
  binSize?: number,
): Promise<ResponseAPI<GradeDistributionData>> {
  const params: Record<string, number> = {};
  if (academicPeriodId) params.academic_period_id = academicPeriodId;
  if (departmentId) params.department_id = departmentId;
  if (binSize) params.bin_size = binSize;

  return api.get("/stats/grade-distribution", { params });
}
