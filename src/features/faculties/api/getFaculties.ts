import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Faculty } from "../types/Faculty";

export default function getFaculties(): Promise<ResponseAPI<Faculty[]>> {
  return api.get("/faculties");
}
