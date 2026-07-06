import { useGetCommentsPaginated } from "@/features/evaluations";
import type { EvaluationComment } from "@/features/evaluations";
import type { ResponseAPI } from "@/shared/types/Response";
import type { UseQueryResult } from "@tanstack/react-query";

export function createCommentsQueryFn(evaluationId: number) {
  return function useCommentsQuery({
    page = 1,
    limit = 10,
    search = "",
  }: {
    page: number;
    limit: number;
    search: string;
  }): UseQueryResult<ResponseAPI<EvaluationComment[]>> {
    return useGetCommentsPaginated(evaluationId, page, limit, search);
  };
}
