import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { updateEvaluationStatus } from "../api/evaluationService";

export default function useUpdateEvaluationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      evaluationId,
      active,
    }: {
      evaluationId: number;
      active: boolean;
    }) => updateEvaluationStatus(evaluationId, { active }),
    onSuccess: (_data, { active }) => {
      queryClient.invalidateQueries({ queryKey: ["evaluations"] });
      toast.success(
        active
          ? "Evaluación activada exitosamente"
          : "Evaluación desactivada exitosamente",
      );
    },
    onError: () => {
      toast.error("Error al cambiar el estado de la evaluación");
    },
  });
}
