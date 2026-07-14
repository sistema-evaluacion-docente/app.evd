import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Plan } from "../types/Plan";

/** Plans of the authenticated teacher (vista del docente). */
export default function getMyPlans(): Promise<ResponseAPI<Plan[]>> {
  return api.get("/improvement-plans/my");
}
