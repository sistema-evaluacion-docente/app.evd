import { useQuery } from "@tanstack/react-query";
import { getEvaluationByPeriod } from "../api/evaluationService";

export default function useGetEvaluationByPeriod(
  periodId: number | undefined,
) {
  return useQuery({
    queryKey: ["evaluation-by-period", periodId],
    queryFn: () => getEvaluationByPeriod(periodId!),
    enabled: !!periodId,
    staleTime: 5 * 60 * 1000,
  });
}
