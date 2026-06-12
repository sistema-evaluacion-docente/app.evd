import api from "@/config/axios";
import type { User } from "@/features/auth/types/User";
import type { ResponseAPI } from "@/shared/types/Response";

interface DisableUserParams {
  userId: string;
}

export default function disableUser({
  userId,
}: DisableUserParams): Promise<ResponseAPI<User>> {
  return api.patch(`/users/${userId}/status`, {
    active: false,
  });
}
