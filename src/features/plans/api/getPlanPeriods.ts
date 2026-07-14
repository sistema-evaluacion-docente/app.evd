import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { PlanPeriod } from "../types/Plan";

/** Periods the department already has grades for (selectable as plan origin). */
export default function getPlanPeriods(): Promise<ResponseAPI<PlanPeriod[]>> {
  return api.get("/improvement-plans/periods");
}
