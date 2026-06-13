import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Period } from "../types/Period";

interface GetPeriodsParams {
  page: number;
  limit: number;
  search: string;
}

export default function getPeriods({
  page = 1,
  limit = 10,
  search = "",
}: GetPeriodsParams): Promise<ResponseAPI<Period[]>> {
  const params: Record<string, string | number> = {};
  if (search) params.search = search;
  return api.get("/academic-periods", { params: { ...params, page, limit } });
}
