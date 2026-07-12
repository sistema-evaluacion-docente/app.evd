import { useQuery } from "@tanstack/react-query";
import getTeacherById from "../api/getTeacherById";

export default function useGetTeacherById(id?: number) {
  return useQuery({
    queryKey: ["teacher", id],
    queryFn: () => {
      if (!id) {
        throw new Error("Teacher ID is required");
      }

      return getTeacherById(id);
    },
    enabled: !!id && id > 0,
  });
}
