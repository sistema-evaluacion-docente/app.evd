import { useMutation, useQueryClient } from "@tanstack/react-query";
import createPeriod from "../api/createPeriod";

export default function useCreatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
  });
}
