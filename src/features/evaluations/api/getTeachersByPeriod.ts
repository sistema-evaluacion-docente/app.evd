import api from "@/config/axios";

import type { ResponseAPI } from "@/shared/types/Response";
import type { TeacherPeriod } from "../types/TeacherPeriod";

export default function getTeachersByPeriod({
  periodId,
  page = 1,
  limit = 10,
  search = "",
}: {
  periodId: number;
  page: number;
  limit: number;
  search: string;
}): Promise<ResponseAPI<TeacherPeriod[]>> {
  const params: Record<string, string | number> = {};

  if (search) params.search = search;

  return api.get(`/evaluations/period/${periodId}/teachers`, {
    params: { ...params, page, limit },
  });
}
