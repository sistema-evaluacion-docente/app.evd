import { useGetEvaluationScoresPaginated } from "@/features/evaluations";
import type { EvaluationScore } from "@/features/evaluations";
import type { ResponseAPI } from "@/shared/types/Response";
import type { UseQueryResult } from "@tanstack/react-query";

export function createScoresQueryFn(evaluationId: number) {
  return function useScoresQuery({
    page = 1,
    limit = 10,
    search = "",
  }: {
    page: number;
    limit: number;
    search: string;
  }): UseQueryResult<ResponseAPI<EvaluationScore[]>> {
    return useGetEvaluationScoresPaginated(evaluationId, page, limit, search);
  };
}
