import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Faculty, CreateFacultyPayload } from "../types/Faculty";

export default function createFaculty(
  data: CreateFacultyPayload,
): Promise<ResponseAPI<Faculty>> {
  return api.post("/faculties", data);
}
