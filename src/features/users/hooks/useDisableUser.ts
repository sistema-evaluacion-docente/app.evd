import { useMutation, useQueryClient } from "@tanstack/react-query";

import disableUser from "../api/disableUser";

export default function useDisableUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: disableUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
