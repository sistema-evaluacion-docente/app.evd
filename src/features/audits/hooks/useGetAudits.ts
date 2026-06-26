import { useQuery } from "@tanstack/react-query";
import getAudits from "../api/getAudits";

export default function useGetAudits({
  page,
  limit,
  search,
  table_name,
  operation,
}: {
  page: number;
  limit: number;
  search: string;
  table_name?: string;
  operation?: string;
}) {
  return useQuery({
    queryKey: ["audits", page, limit, search, table_name, operation],
    queryFn: () => getAudits({ page, limit, search, table_name, operation }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
