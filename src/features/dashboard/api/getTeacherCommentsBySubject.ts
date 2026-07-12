import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";

export interface TeacherCommentSubjectItem {
  course_code: string;
  course_name: string | null;
  faculty_name: string | null;
  comment_count: number;
}

export interface TeacherCommentsBySubjectData {
  teacher_id: number;
  academic_period_id: number;
  total_comments: number;
  subjects: TeacherCommentSubjectItem[];
}

export default function getTeacherCommentsBySubject(
  teacherId: number,
  academicPeriodId: number,
): Promise<ResponseAPI<TeacherCommentsBySubjectData>> {
  return api.get("/stats/teacher-comments-by-subject", {
    params: {
      teacher_id: teacherId,
      academic_period_id: academicPeriodId,
    },
  });
}
