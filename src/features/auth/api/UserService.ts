import api from "@/config/axios";
import type { ResponseAPI, ResponsePagination } from "@/shared/types/Response";
import type { User } from "@/features/auth/types/User";
import type { Role } from "../types/Role";

export const getAuthUser = async (): Promise<ResponseAPI<User>> => {
  return api.get("/users/auth");
};

export const getUserById = async (
  userId: string,
): Promise<ResponseAPI<User>> => {
  return api.get(`/users/${userId}`);
};

export const getAllRoles = async (): Promise<ResponsePagination<Role>> => {
  return api.get("/roles");
};

// export const saveUser = async (userData: UserRegisterData) => {
//   return api.post("/users", userData);
// };

// export const saveUserByAdmin = async (userData: UserRegisterDataAdmin) => {
//   return api.post("/users/admin", userData);
// };

// export const updateUser = async (userData: UserRegisterData) => {
//   return api.put("/users", userData);
// };

// export const updateUserStatus = async (userId: string, isActive: boolean) => {
//   return api.patch(`/users/${userId}/status`, { isActive });
// };

// export const updateUserRole = async (userId: string, role: string) => {
//   return api.patch(`/users/${userId}/role`, { role });
// };
