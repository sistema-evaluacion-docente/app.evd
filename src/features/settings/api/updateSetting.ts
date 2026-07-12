import api from "@/config/axios";
import type { ResponseAPI } from "@/shared/types/Response";
import type { Setting } from "../types/Setting";

interface UpdateSettingParams {
  id: number;
  value: string;
  change_reason?: string;
}

export default function updateSetting({
  id,
  ...data
}: UpdateSettingParams): Promise<ResponseAPI<Setting>> {
  return api.put(`/settings/${id}`, data);
}
