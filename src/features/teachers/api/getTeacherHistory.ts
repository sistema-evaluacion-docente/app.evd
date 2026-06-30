import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { TeacherHistoryData } from "../types/Teacher";

export default function getTeacherHistory(
  id: number,
): Promise<ResponseAPI<TeacherHistoryData>> {
  return api.get(`/teachers/${id}/history`);
}
