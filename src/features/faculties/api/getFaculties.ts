import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Faculty } from "../types/Faculty";

export default function getFaculties({
  page = 1,
  limit = 10,
  search
}: {
  page?: number,
  limit?: number,
  search?: string
}): Promise<ResponseAPI<Faculty[]>> {
  return api.get("/faculties", {
    params: { page, limit, search }
  });
}
