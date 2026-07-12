import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface TeacherDimensionAverageItem {
  dimension: string;
  average: number | null;
  percentage: number | null;
}

export interface TeacherDimensionAveragesData {
  teacher_id: number;
  academic_period_id: number;
  dimensions: TeacherDimensionAverageItem[];
}

export default function getTeacherDimensionAverages(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherDimensionAveragesData>> {
  return api.get("/stats/teacher-dimension-averages", {
    params: {
      teacher_id: teacherId,
      academic_period_id: academicPeriodId,
    },
  });
}
