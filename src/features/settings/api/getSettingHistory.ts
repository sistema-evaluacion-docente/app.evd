import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { SettingHistory } from "../types/Setting";

interface GetSettingHistoryParams {
  settingId: number;
  page: number;
  limit: number;
}

export default function getSettingHistory({
  settingId,
  page = 1,
  limit = 10,
}: GetSettingHistoryParams): Promise<ResponseAPI<SettingHistory[]>> {
  return api.get(`/settings/${settingId}/history`, {
    params: { page, limit },
  });
}
