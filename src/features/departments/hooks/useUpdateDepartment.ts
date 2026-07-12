import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateDepartment from "../api/updateDepartment";

export default function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
