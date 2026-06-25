import { useQuery } from "@tanstack/react-query";
import getEvaluations from "../api/getEvaluations";

export default function useGetEvaluations({
  page = 1,
  limit = 10,
  search = "",
}: {
  page: number;
  limit: number;
  search: string;
}) {
  return useQuery({
    queryKey: ["evaluations", page, limit, search],
    queryFn: () => getEvaluations({ page, limit, search }),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
