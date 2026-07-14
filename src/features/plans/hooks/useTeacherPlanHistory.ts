import { useQuery } from "@tanstack/react-query";
import getTeacherPlanHistory from "../api/getTeacherPlanHistory";

export default function useTeacherPlanHistory(teacherId: number | null) {
  return useQuery({
    queryKey: ["teacher-plan-history", teacherId],
    queryFn: () => getTeacherPlanHistory(teacherId as number),
    enabled: teacherId != null,
  });
}
