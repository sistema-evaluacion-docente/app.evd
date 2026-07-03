import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface TeacherRankItem {
  teacher_id: number;
  institutional_code: string;
  name: string;
  avatar_url: string | null;
  contract_type: string | null;
  group_count: number;
  overall_average: number | null;
}

export interface TeacherPerformanceData {
  academic_period_id: number | null;
  academic_period_code: string | null;
  academic_period_name: string | null;
  top_5: TeacherRankItem[];
  bottom_5: TeacherRankItem[];
}

export default function getTeacherPerformance(
  academicPeriodId?: string,
): Promise<ResponseAPI<TeacherPerformanceData>> {
  return api.get("/stats/teacher-performance", {
    params: academicPeriodId ? { academic_period_id: academicPeriodId } : {},
  });
}
