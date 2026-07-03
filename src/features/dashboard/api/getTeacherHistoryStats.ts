import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface TeacherHistoryEntry {
  period_code: string;
  period_name: string | null;
  overall_average: number | null;
}

export default function getTeacherHistoryStats(
  teacherId: number,
): Promise<ResponseAPI<TeacherHistoryEntry[]>> {
  return api.get("/stats/teacher-history", {
    params: { teacher_id: teacherId },
  });
}
