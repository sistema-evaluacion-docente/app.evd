import type { UseQueryResult } from "@tanstack/react-query";

import type { ResponseAPI } from "@/shared/types/Response";
import type { EvaluationScore } from "../types/Evaluation";
import useGetEvaluationScoresPaginated from "../hooks/useGetEvaluationScoresPaginated";

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
