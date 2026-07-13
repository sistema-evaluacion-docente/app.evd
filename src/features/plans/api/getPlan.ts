import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Plan } from "../types/Plan";

export default function getPlan(id: number): Promise<ResponseAPI<Plan>> {
  return api.get(`/improvement-plans/${id}`);
}
