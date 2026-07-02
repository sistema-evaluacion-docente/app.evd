import { useQuery } from "@tanstack/react-query";
import getTeacherById from "../api/getTeacherById";

export default function useGetTeacherById(id: number) {
  return useQuery({
    queryKey: ["teacher", id],
    queryFn: () => getTeacherById(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}
