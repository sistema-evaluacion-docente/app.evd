import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addEvidence, deleteEvidence } from "../api/evidences";

function useInvalidatePlan() {
  const queryClient = useQueryClient();

  return (planId: number) => {
    queryClient.invalidateQueries({ queryKey: ["plan", planId] });
    queryClient.invalidateQueries({ queryKey: ["plans"] });
    queryClient.invalidateQueries({ queryKey: ["my-plans"] });
  };
}

export function useAddEvidence() {
  const invalidate = useInvalidatePlan();

  return useMutation({
    mutationFn: addEvidence,
    onSuccess: (_res, { planId }) => invalidate(planId),
  });
}

export function useDeleteEvidence() {
  const invalidate = useInvalidatePlan();

  return useMutation({
    mutationFn: deleteEvidence,
    onSuccess: (_res, { planId }) => invalidate(planId),
  });
}
