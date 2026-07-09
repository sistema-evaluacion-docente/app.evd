import { useQuery } from "@tanstack/react-query";
import { getTeacherMatrix } from "../api/evaluationService";

export default function useGetTeacherMatrix(
  teacherId: number,
  evaluationId: number | undefined,
) {
  return useQuery({
    queryKey: ["teacher-matrix", teacherId, evaluationId],
    queryFn: () => getTeacherMatrix(teacherId, evaluationId!),
    enabled: !!teacherId && !!evaluationId,
  });
}
