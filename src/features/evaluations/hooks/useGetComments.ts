import { useQuery } from "@tanstack/react-query";
import { getComments } from "../api/evaluationService";

export default function useGetComments(evaluationId: number | undefined) {
  return useQuery({
    queryKey: ["comments", evaluationId],
    queryFn: () => getComments(evaluationId!),
    enabled: !!evaluationId,
    staleTime: 5 * 60 * 1000,
  });
}
