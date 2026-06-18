import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateSetting from "../api/updateSetting";

export default function useUpdateSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
  });
}
