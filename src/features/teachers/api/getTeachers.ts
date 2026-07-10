import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Teacher } from "../types/Teacher";

export default function getTeachers({
  page = 1,
  limit = 10,
  search = "",
  academic_period_id,
}: {
  page: number;
  limit: number;
  search: string;
  academic_period_id?: number;
}): Promise<ResponseAPI<Teacher[]>> {
  const params: Record<string, string | number> = {};

  if (search) {
    params.search = search;
  }

  if (academic_period_id) {
    params.academic_period_id = academic_period_id;
  }

  return api.get("/teachers", {
    params: { ...params, page, limit },
  });
}
