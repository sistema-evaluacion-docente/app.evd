import { useQuery } from "@tanstack/react-query";
import getSettingHistory from "../api/getSettingHistory";

interface UseGetSettingHistoryParams {
  settingId: number | null;
  page: number;
  limit: number;
}

export default function useGetSettingHistory({
  settingId,
  page = 1,
  limit = 10,
}: UseGetSettingHistoryParams) {
  return useQuery({
    queryKey: ["setting-history", settingId, page, limit],
    queryFn: () => getSettingHistory({ settingId: settingId!, page, limit }),
    enabled: settingId !== null,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
