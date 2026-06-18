import { useQuery } from "@tanstack/react-query";
import getPeriods from "../api/getPeriods";

export default function useGetPeriods({
  page = 1,
  limit = 10,
  search = "",
}: {
  page: number;
  limit: number;
  search: string;
}) {
  return useQuery({
    queryKey: ["periods", page, limit, search],
    queryFn: () => getPeriods({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
