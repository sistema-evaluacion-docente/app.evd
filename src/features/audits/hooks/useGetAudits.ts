import { useQuery } from "@tanstack/react-query";
import getAudits from "../api/getAudits";

export default function useGetAudits({
  page,
  limit,
  search,
  table_name,
  operation,
  start_date,
  end_date,
}: {
  page: number;
  limit: number;
  search: string;
  table_name?: string;
  operation?: string;
  start_date?: string;
  end_date?: string;
}) {
  return useQuery({
    queryKey: [
      "audits",
      page,
      limit,
      search,
      table_name,
      operation,
      start_date,
      end_date,
    ],
    queryFn: () =>
      getAudits({
        page,
        limit,
        search,
        table_name,
        operation,
        start_date,
        end_date,
      }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
