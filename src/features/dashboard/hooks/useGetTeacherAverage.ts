import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods";
import useAuth from "@/shared/hooks/useAuth";
import getTeacherAverage from "../api/getTeacherAverage";

export default function useGetTeacherAverage() {
  const { user } = useAuth();

  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);
  const teacherId = user?.teacher_id;

  return useQuery({
    queryKey: ["teacher-average", teacherId, selectedPeriod?.id],
    queryFn: () =>
      getTeacherAverage(Number(teacherId), Number(selectedPeriod?.id)),
    enabled: !!teacherId && !!selectedPeriod?.id,
  });
}
