import { useMutation, useQueryClient } from "@tanstack/react-query";
import closePlan from "../api/closePlan";
import type { ClosePlanInput } from "../types/Plan";

export default function useClosePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ClosePlanInput }) =>
      closePlan(id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", variables.id] });
    },
  });
}
