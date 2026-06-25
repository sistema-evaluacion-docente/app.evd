import { useMutation, useQueryClient } from "@tanstack/react-query";
import createDepartment from "../api/createDepartment";

export default function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
