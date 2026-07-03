import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

interface TeacherCommentCountResponse {
  current_count: number;
  previous_count: number;
  teacher_id: number;
  academic_period_id: number;
}

export default function getTeacherCommentCount(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherCommentCountResponse>> {
  return api.get("/comments/teacher-count", {
    params: {
      teacher_id: teacherId,
      academic_period_id: academicPeriodId,
    },
  });
}
