import { useQuery } from "@tanstack/react-query";
import getPlanCandidates from "../api/getPlanCandidates";

export default function usePlanCandidates(
  periodId: number | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["plan-candidates", periodId],
    queryFn: () => getPlanCandidates({ period_id: periodId as number }),
    enabled: enabled && periodId != null,
    staleTime: 60 * 1000,
  });
}
