import { useQuery } from "@tanstack/react-query";
import { getEvaluation } from "../api/evaluationService";

export default function useGetEvaluation(evaluationId: number | undefined) {
  return useQuery({
    queryKey: ["evaluation", evaluationId],
    queryFn: () => getEvaluation(evaluationId!),
    enabled: !!evaluationId,
    staleTime: 5 * 60 * 1000,
  });
}
