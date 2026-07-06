import { useQuery } from "@tanstack/react-query";
import { getEvaluationSummary } from "../api/evaluationService";

export default function useGetEvaluationSummary(
  evaluationId: number | undefined,
) {
  return useQuery({
    queryKey: ["evaluation-summary", evaluationId],
    queryFn: () => getEvaluationSummary(evaluationId!),
    enabled: !!evaluationId,
    staleTime: 5 * 60 * 1000,
  });
}
