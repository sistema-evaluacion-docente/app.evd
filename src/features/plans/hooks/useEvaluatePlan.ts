import { useMutation, useQueryClient } from "@tanstack/react-query";
import evaluatePlan from "../api/evaluatePlan";

export default function useEvaluatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => evaluatePlan(id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", id] });
    },
  });
}
