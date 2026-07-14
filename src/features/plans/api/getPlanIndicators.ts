import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { PlanIndicators } from "../types/Plan";

/** Indicators a commitment can target: overall average, dimensions and their items. */
export default function getPlanIndicators(): Promise<
  ResponseAPI<PlanIndicators>
> {
  return api.get("/improvement-plans/indicators");
}
