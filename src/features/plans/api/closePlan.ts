import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { ClosePlanInput, Plan } from "../types/Plan";

export default function closePlan(
  id: number,
  data: ClosePlanInput,
): Promise<ResponseAPI<Plan>> {
  return api.post(`/improvement-plans/${id}/close`, data);
}
