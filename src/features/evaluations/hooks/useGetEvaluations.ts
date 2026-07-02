import { useQuery } from "@tanstack/react-query";
import getEvaluations from "../api/getEvaluations";

export default function useGetEvaluations({
  page = 1,
  limit = 10,
  search = "",
  period_id,
  department_id,
  enabled: externalEnabled,
}: {
  page: number;
  limit: number;
  search: string;
  period_id?: string;
  department_id?: number;
  enabled?: boolean;
}) {
  const periodEnabled = period_id !== undefined ? !!period_id : true
  return useQuery({
    queryKey: ["evaluations", page, limit, search, period_id, department_id],
    queryFn: () => getEvaluations({ page, limit, search, period_id, department_id }),
    enabled: periodEnabled && (externalEnabled ?? true),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}
