import { useQuery } from "@tanstack/react-query";
import { getDimensionAverages } from "../api/evaluationService";

export default function useGetDimensionAverages(evaluationId: number | undefined) {
  return useQuery({
    queryKey: ["dimension-averages", evaluationId],
    queryFn: () => getDimensionAverages(evaluationId!),
    enabled: !!evaluationId,
    staleTime: 5 * 60 * 1000,
  });
}
