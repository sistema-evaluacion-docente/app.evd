import { useQuery } from "@tanstack/react-query";
import { getTeacherDetailByPeriod } from "../api/evaluationService";

export default function useGetTeacherDetailByPeriod(
  teacherId: number,
  period: string | undefined,
) {
  return useQuery({
    queryKey: ["teacher-detail-by-period", teacherId, period],
    queryFn: () => getTeacherDetailByPeriod(teacherId, period!),
    enabled: !!teacherId && !!period,
    staleTime: 5 * 60 * 1000,
  });
}
