import api from "@/config/axios";
import type { User } from "@/features/auth/types/User";
import type { ResponseAPI } from "@/shared/types/Response";

export default function getAllUsers({
  page = 1,
  search = "",
}): Promise<ResponseAPI<User[]>> {
  const params: Record<string, string | number> = {};

  if (search) {
    params.search = search;
  }

  return api.get(`/users`, {
    params,
  });
}
