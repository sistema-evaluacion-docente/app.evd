import { useQuery } from "@tanstack/react-query";
import getAudits from "../api/getAudits";

export default function useGetAudits({
  page,
  limit,
  search,
}: {
  page: number;
  limit: number;
  search: string;
}) {
  return useQuery({
    queryKey: ["audits", page, limit, search],
    queryFn: () => getAudits({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
