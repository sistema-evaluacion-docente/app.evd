import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Setting } from "../types/Setting";

interface GetSettingsParams {
  page: number;
  limit: number;
  search: string;
}

export default function getSettings({
  page = 1,
  limit = 10,
  search = "",
}: GetSettingsParams): Promise<ResponseAPI<Setting[]>> {
  const params: Record<string, string | number> = {};
  if (search) params.search = search;
  return api.get("/settings", { params: { ...params, page, limit } });
}
