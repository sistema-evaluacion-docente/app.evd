import api from "@/config/axios";
import type { User } from "@/features/auth/types/User";
import type { ResponseAPI } from "@/shared/types/Response";

export default function getTeachers({
  page = 1,
  limit = 10,
  search = "",
}): Promise<ResponseAPI<User[]>> {
  const params: Record<string, string | number> = {};

  if (search) {
    params.search = search;
  }

  return api.get("/teachers", {
    params: { ...params, page, limit },
  });
}
