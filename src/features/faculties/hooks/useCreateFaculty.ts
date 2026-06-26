import { useMutation, useQueryClient } from "@tanstack/react-query";
import createFaculty from "../api/createFaculty";

export default function useCreateFaculty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculties"] });
    },
  });
}
