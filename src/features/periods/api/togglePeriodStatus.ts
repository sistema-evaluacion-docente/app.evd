import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Period } from "../types/Period";

interface TogglePeriodStatusParams {
  periodId: string;
  active: boolean;
}

export default function togglePeriodStatus({
  periodId,
  active,
}: TogglePeriodStatusParams): Promise<ResponseAPI<Period>> {
  return api.patch(`/academic-periods/${periodId}/status`, { active });
}
