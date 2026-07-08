import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods";
import useAuth from "@/shared/hooks/useAuth";
import getTeacherCommentsBySubject from "../api/getTeacherCommentsBySubject";

export default function useGetTeacherCommentsBySubject() {
  const { user } = useAuth();

  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);
  const teacherId = user?.teacher_id;

  return useQuery({
    queryKey: ["teacher-comments-by-subject", teacherId, selectedPeriod?.id],
    queryFn: () =>
      getTeacherCommentsBySubject(
        Number(teacherId),
        Number(selectedPeriod?.id),
      ),
    enabled: !!teacherId && !!selectedPeriod?.id,
  });
}
