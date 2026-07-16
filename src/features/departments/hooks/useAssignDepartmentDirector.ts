import { useMutation, useQueryClient } from "@tanstack/react-query";

import assignDepartmentDirector from "../api/assignDepartmentDirector";

/**
 * Custom hook to assign a director to a department.
 * @returns A mutation object that can be used to trigger the assignment of a director to a department.
 */
export default function useAssignDepartmentDirector() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: assignDepartmentDirector,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
  });
}
