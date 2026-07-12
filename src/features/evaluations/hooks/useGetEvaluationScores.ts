import { useQuery } from "@tanstack/react-query";
import { getEvaluationScores } from "../api/evaluationService";

export default function useGetEvaluationScores(
  evaluationId: number | undefined,
) {
  return useQuery({
    queryKey: ["evaluation-scores", evaluationId],
    queryFn: () => getEvaluationScores(evaluationId!),
    enabled: !!evaluationId,
    staleTime: 5 * 60 * 1000,
  });
}
