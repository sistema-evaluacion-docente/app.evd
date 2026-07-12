import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods";
import useAuth from "@/shared/hooks/useAuth";
import getTeacherCourses from "../api/getTeacherCourses";

export default function useGetTeacherCourses() {
  const { user } = useAuth();
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);
  const teacherId = user?.teacher_id;

  return useQuery({
    queryKey: ["teacher-courses", teacherId, selectedPeriod?.id],
    queryFn: () =>
      getTeacherCourses(Number(teacherId), Number(selectedPeriod?.id)),
    enabled: !!teacherId && !!selectedPeriod?.id,
  });
}
