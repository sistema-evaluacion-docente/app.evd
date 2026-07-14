import { useQuery } from "@tanstack/react-query";
import { getTeacherVsDepartment } from "../api/evaluationService";

export default function useGetTeacherVsDepartment(
  teacherId: number,
  academicPeriodId: number | undefined,
) {
  return useQuery({
    queryKey: ["teacher-vs-department", teacherId, academicPeriodId],
    queryFn: () => getTeacherVsDepartment(teacherId, academicPeriodId!),
    enabled: !!teacherId && !!academicPeriodId,
    staleTime: 5 * 60 * 1000,
  });
}
