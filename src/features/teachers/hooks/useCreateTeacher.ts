import { useMutation, useQueryClient } from "@tanstack/react-query";

import createTeacher from "../api/createTeacher";

export default function useCreateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}
