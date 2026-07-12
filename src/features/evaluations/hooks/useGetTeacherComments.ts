import { useQuery } from "@tanstack/react-query";
import { getTeacherComments } from "../api/evaluationService";

export default function useGetTeacherComments(
  evaluationId: number | undefined,
  teacherId: number,
) {
  return useQuery({
    queryKey: ["teacher-comments", evaluationId, teacherId],
    queryFn: () => getTeacherComments(evaluationId!, teacherId),
    enabled: !!evaluationId && !!teacherId,
    staleTime: 5 * 60 * 1000,
  });
}
