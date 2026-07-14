import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { TeacherPlanHistory } from "../types/Plan";

/** Cross-period history of a teacher: averages, plans and recurrences. */
export default function getTeacherPlanHistory(
  teacherId: number,
): Promise<ResponseAPI<TeacherPlanHistory>> {
  return api.get(`/improvement-plans/teacher/${teacherId}/history`);
}
