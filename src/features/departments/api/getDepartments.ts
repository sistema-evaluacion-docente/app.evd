import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Department } from "../types/Department";

export default function getDepartments(): Promise<ResponseAPI<Department[]>> {
  return api.get("/departments");
}
