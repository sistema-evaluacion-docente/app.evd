import { useQuery } from "@tanstack/react-query";
import { getTeacherEvaluationDetail } from "../api/evaluationService";

export default function useGetTeacherEvaluationDetail(
  evaluationId: number | undefined,
  teacherId: number,
) {
  return useQuery({
    queryKey: ["teacher-evaluation-detail", evaluationId, teacherId],
    queryFn: () => getTeacherEvaluationDetail(evaluationId!, teacherId),
    enabled: !!evaluationId && !!teacherId,
  });
}
