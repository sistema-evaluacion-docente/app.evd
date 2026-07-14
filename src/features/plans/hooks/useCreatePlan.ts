import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPlan from "../api/createPlan";

export default function useCreatePlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["at-risk"] });
    },
  });
}
