import { useMutation, useQueryClient } from "@tanstack/react-query";

import updateUserRoles from "../api/updateUserRoles";

export default function useUpdateUserRoles() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUserRoles,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}
