import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods";
import useAuth from "@/shared/hooks/useAuth";
import getTeacherCommentCount from "../api/getTeacherCommentCount";

export default function useGetTeacherCommentCount() {
  const { user } = useAuth();

  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);
  const teacherId = user?.teacher_id;

  return useQuery({
    queryKey: ["teacher-comment-count", teacherId, selectedPeriod?.id],
    queryFn: () =>
      getTeacherCommentCount(Number(teacherId), Number(selectedPeriod?.id)),
    enabled: !!teacherId && !!selectedPeriod?.id,
  });
}
