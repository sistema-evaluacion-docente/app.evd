import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Period } from "../types/Period";

interface UpdatePeriodParams {
  id: string;
  codigo: string;
  nombre: string;
  start: string;
  end: string;
  evalStart: string;
  evalEnd: string;
}

export default function updatePeriod({
  id,
  ...data
}: UpdatePeriodParams): Promise<ResponseAPI<Period>> {
  return api.put(`/academic-periods/${id}`, data);
}
