import { useQuery } from "@tanstack/react-query";
import { getEvaluationScoresPaginated } from "../api/evaluationService";

export default function useGetEvaluationScoresPaginated(
  evaluationId: number | undefined,
  page: number,
  limit: number,
  search: string,
) {
  return useQuery({
    queryKey: ["evaluation-scores-paginated", evaluationId, page, limit, search],
    queryFn: () =>
      getEvaluationScoresPaginated(evaluationId!, page, limit, search),
    enabled: !!evaluationId,
    staleTime: 5 * 60 * 1000,
  });
}
