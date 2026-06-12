import api from "@/config/axios";
import type { User } from "@/features/auth/types/User";
import type { ResponseAPI } from "@/shared/types/Response";

interface EnableUserParams {
  userId: string;
}

export default function enableUser({
  userId,
}: EnableUserParams): Promise<ResponseAPI<User>> {
  return api.patch(`/users/${userId}/status`, {
    active: true,
    isActive: true,
  });
}
