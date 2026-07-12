import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface TeacherCourseItem {
  course_code: string;
  course_name: string | null;
  group_name: string | null;
  overall_average: number | null;
}

export default function getTeacherCourses(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherCourseItem[]>> {
  return api.get("/stats/teacher-courses", {
    params: {
      teacher_id: teacherId,
      academic_period_id: academicPeriodId,
    },
  });
}
