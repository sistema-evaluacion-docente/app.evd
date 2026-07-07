import { useQuery } from "@tanstack/react-query";
import { getCommentsPaginated } from "../api/evaluationService";

export default function useGetCommentsPaginated(
  evaluationId: number | undefined,
  page: number,
  limit: number,
  search: string,
) {
  return useQuery({
    queryKey: ["comments-paginated", evaluationId, page, limit, search],
    queryFn: () =>
      getCommentsPaginated(evaluationId!, page, limit, search),
    enabled: !!evaluationId,
    staleTime: 5 * 60 * 1000,
  });
}
