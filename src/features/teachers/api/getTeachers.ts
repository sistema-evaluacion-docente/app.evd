import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Teacher } from "../types/Teacher";

export default function getTeachers({
  page = 1,
  limit = 10,
  search = "",
  academic_period_id,
  department_id,
  active,
  sort_by,
}: {
  page: number;
  limit: number;
  search: string;
  academic_period_id?: number;
  department_id?: number;
  active?: boolean;
  sort_by?: string;
}): Promise<ResponseAPI<Teacher[]>> {
  const params: Record<string, string | number | boolean> = {};

  if (search) {
    params.search = search;
  }

  if (academic_period_id) {
    params.academic_period_id = academic_period_id;
  }

  if (active !== undefined) {
    params.active = active;
  }

  if (department_id !== undefined) {
    params.department_id = department_id;
  }

  if (sort_by) {
    params.sort_by = sort_by;
  }

  return api.get("/teachers/with-averages", {
    params: { ...params, page, limit },
  });
}
