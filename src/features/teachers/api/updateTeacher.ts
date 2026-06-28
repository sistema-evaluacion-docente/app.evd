import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Teacher, UpdateTeacherPayload } from "../types/Teacher";

export default function updateTeacher({
  id,
  ...data
}: UpdateTeacherPayload): Promise<ResponseAPI<Teacher>> {
  return api.put(`/teachers/${id}`, data);
}
