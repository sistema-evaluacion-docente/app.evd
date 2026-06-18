import { useQuery } from "@tanstack/react-query";
import getSettings from "../api/getSettings";

export default function useGetSettings({
  page = 1,
  limit = 10,
  search = "",
}: {
  page: number;
  limit: number;
  search: string;
}) {
  return useQuery({
    queryKey: ["settings", page, limit, search],
    queryFn: () => getSettings({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
