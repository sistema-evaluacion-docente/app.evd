import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Faculty, UpdateFacultyPayload } from "../types/Faculty";

export default function updateFaculty({
  id,
  ...data
}: UpdateFacultyPayload & { id: number }): Promise<ResponseAPI<Faculty>> {
  return api.put(`/faculties/${id}`, data);
}
