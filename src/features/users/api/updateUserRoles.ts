import api from "@/config/axios";
import type { User } from "@/features/auth/types/User";
import type { ResponseAPI } from "@/shared/types/Response";

interface UpdateUserRolesParams {
  userId: string;
  roles: string[];
}

export default function updateUserRoles({
  userId,
  roles,
}: UpdateUserRolesParams): Promise<ResponseAPI<User>> {
  return api.put(`/users/${userId}/roles`, { roles });
}
