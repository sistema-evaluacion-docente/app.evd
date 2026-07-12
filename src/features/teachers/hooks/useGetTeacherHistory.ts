import { useQuery } from "@tanstack/react-query";
import getTeacherHistory from "../api/getTeacherHistory";

export default function useGetTeacherHistory(id: number) {
  return useQuery({
    queryKey: ["teacher-history", id],
    queryFn: () => getTeacherHistory(id),
    enabled: !!id && id > 0,
    staleTime: 5 * 60 * 1000,
  });
}
