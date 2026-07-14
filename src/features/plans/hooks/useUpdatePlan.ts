import { useMutation, useQueryClient } from "@tanstack/react-query";
import updatePlan from "../api/updatePlan";
import type { UpdatePlanInput } from "../types/Plan";

export default function useUpdatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePlanInput }) =>
      updatePlan(id, data),
    onSuccess: (_res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["plan", variables.id] });
    },
  });
}
