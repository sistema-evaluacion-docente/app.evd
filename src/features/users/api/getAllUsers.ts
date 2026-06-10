import api from "@/config/axios";
import type { User } from "@/features/auth/types/User";
import type { ResponseAPI } from "@/shared/types/Response";

export default function getAllUsers(page = 1): Promise<ResponseAPI<User[]>> {
  return api.get(`/users?page=${page}`);
}
