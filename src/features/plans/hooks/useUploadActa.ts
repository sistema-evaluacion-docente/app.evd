import { useMutation, useQueryClient } from "@tanstack/react-query";
import uploadActa from "../api/uploadActa";

export default function useUploadActa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadActa,
    onSuccess: (_res, { planId }) => {
      queryClient.invalidateQueries({ queryKey: ["plan", planId] });
      queryClient.invalidateQueries({ queryKey: ["plans"] });
      queryClient.invalidateQueries({ queryKey: ["my-plans"] });
    },
  });
}
