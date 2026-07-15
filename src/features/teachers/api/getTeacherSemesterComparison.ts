import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { TeacherSemesterComparisonData } from "../types/Teacher";

export default function getTeacherSemesterComparison({
  teacher_id,
  current_semester,
  old_semester,
}: {
  teacher_id: number;
  current_semester: number;
  old_semester: number;
}): Promise<ResponseAPI<TeacherSemesterComparisonData>> {
  return api.get("/comparison/teachers", {
    params: {
      teacher_id,
      current_semester,
      old_semester,
    },
  });
}
