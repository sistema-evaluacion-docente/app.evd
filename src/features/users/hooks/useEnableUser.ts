import { useMutation, useQueryClient } from "@tanstack/react-query";

import enableUser from "../api/enableUser";

export default function useEnableUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: enableUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
