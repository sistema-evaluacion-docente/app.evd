import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { CreatePlanInput, Plan } from "../types/Plan";

export default function createPlan(
  data: CreatePlanInput,
): Promise<ResponseAPI<Plan>> {
  return api.post("/improvement-plans/", data);
}
