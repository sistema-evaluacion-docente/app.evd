import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Teacher, TeacherCreatePayload } from "../types/Teacher";

export default function createTeacher(
  data: TeacherCreatePayload,
): Promise<ResponseAPI<Teacher>> {
  return api.post("/teachers", data);
}
