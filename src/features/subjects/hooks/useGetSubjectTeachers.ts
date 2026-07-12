import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods";
import { getSubjectTeachers } from "../api/subjectsService";

export default function useGetSubjectTeachers(courseId: number) {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useQuery({
    queryKey: ["subject-teachers", courseId, selectedPeriod?.id],
    queryFn: () => getSubjectTeachers(courseId, Number(selectedPeriod!.id)),
    enabled: !!courseId && !!selectedPeriod?.id,
    staleTime: 5 * 60 * 1000,
  });
}
