import { useMutation, useQueryClient } from "@tanstack/react-query";
import updateFaculty from "../api/updateFaculty";

export default function useUpdateFaculty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculties"] });
    },
  });
}
