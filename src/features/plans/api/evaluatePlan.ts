import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Plan } from "../types/Plan";

export default function evaluatePlan(id: number): Promise<ResponseAPI<Plan>> {
  return api.post(`/improvement-plans/${id}/evaluate`);
}
