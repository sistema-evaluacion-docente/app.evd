import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Teacher } from "../types/Teacher";

export default function deleteTeacher(id: number): Promise<ResponseAPI<Teacher>> {
  return api.delete(`/teachers/${id}`);
}
