import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Teacher } from "../types/Teacher";

export default function getTeachers({
  page = 1,
  limit = 10,
  search = "",
}): Promise<ResponseAPI<Teacher[]>> {
  const params: Record<string, string | number> = {};

  if (search) {
    params.search = search;
  }

  return api.get("/teachers", {
    params: { ...params, page, limit },
  });
}
