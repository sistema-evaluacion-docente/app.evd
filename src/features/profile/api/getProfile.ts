import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Profile } from "../types/Profile";

export default async function getProfile(): Promise<ResponseAPI<Profile>> {
  return api.get("/users/auth");
}
