import { useQuery } from "@tanstack/react-query";

import useAuth from "@/shared/hooks/useAuth";
import getTeacherHistoryStats from "../api/getTeacherHistoryStats";

export default function useGetTeacherHistoryStats() {
  const { user } = useAuth();
  const teacherId = user?.teacher_id;

  return useQuery({
    queryKey: ["teacher-history-stats", teacherId],
    queryFn: () => getTeacherHistoryStats(Number(teacherId)),
    enabled: !!teacherId,
  });
}
