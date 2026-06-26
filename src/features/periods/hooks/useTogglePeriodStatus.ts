import { useMutation, useQueryClient } from "@tanstack/react-query";
import togglePeriodStatus from "../api/togglePeriodStatus";

export default function useTogglePeriodStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: togglePeriodStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["periods"] });
    },
  });
}
