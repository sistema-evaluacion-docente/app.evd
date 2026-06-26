import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Period } from "../types/Period";

export interface CreatePeriodParams {
  name: string;
  start_date: string;
  end_date: string;
  evaluation_end_date?: string;
  final_evaluation_date?: string;
}

export default function createPeriod(
  data: CreatePeriodParams,
): Promise<ResponseAPI<Period>> {
  return api.post("/academic-periods", {
    ...data,
    code: data.name,
  });
}
