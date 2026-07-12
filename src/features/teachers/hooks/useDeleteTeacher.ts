import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import deleteTeacher from "../api/deleteTeacher";

export default function useDeleteTeacher() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTeacher,
    onSuccess: (data) => {
      if (data?.status !== 200) {
        toast.error(`Error: ${data?.message}`);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ["teachers"] });
      toast.success("Docente eliminado exitosamente");
    },
    onError: (error) => {
      toast.error(`Error al eliminar el docente: ${error?.message}`);
    },
  });
}
