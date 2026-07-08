import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods";
import useAuth from "@/shared/hooks/useAuth";
import getTeacherDimensionAverages from "../api/getTeacherDimensionAverages";

export default function useGetTeacherDimensionAverages() {
  const { user } = useAuth();

  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);
  const teacherId = user?.teacher_id;

  return useQuery({
    queryKey: ["teacher-dimension-averages", teacherId, selectedPeriod?.id],
    queryFn: () =>
      getTeacherDimensionAverages(
        Number(teacherId),
        Number(selectedPeriod?.id),
      ),
    enabled: !!teacherId && !!selectedPeriod?.id,
  });
}
