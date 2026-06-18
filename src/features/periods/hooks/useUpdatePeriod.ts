import { useMutation, useQueryClient } from "@tanstack/react-query";
import updatePeriod from "../api/updatePeriod";

export default function useUpdatePeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePeriod,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
  });
}
