import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface TeacherAverageData {
  teacher_id: number;
  academic_period_id: number;
  academic_period_code: string;
  academic_period_name: string | null;
  overall_average: number | null;
  group_count: number;
  previous_academic_period_id: number | null;
  previous_academic_period_code: string | null;
  previous_academic_period_name: string | null;
  previous_overall_average: number | null;
  previous_group_count: number | null;
}

export default function getTeacherAverage(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherAverageData>> {
  return api.get("/stats/teacher-average", {
    params: {
      teacher_id: teacherId,
      academic_period_id: academicPeriodId,
    },
  });
}
