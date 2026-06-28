import { useMutation, useQueryClient } from "@tanstack/react-query";

import updateTeacher from "../api/updateTeacher";

export default function useUpdateTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teachers"] });
    },
  });
}
