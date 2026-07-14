import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Plan, UpdatePlanInput } from "../types/Plan";

export default function updatePlan(
  id: number,
  data: UpdatePlanInput,
): Promise<ResponseAPI<Plan>> {
  return api.put(`/improvement-plans/${id}`, data);
}
