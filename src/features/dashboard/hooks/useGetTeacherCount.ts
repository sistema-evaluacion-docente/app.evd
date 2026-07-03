import { useQuery } from "@tanstack/react-query";

import getTeacherCount from "../api/getTeacherCount";
import { usePeriodsStore } from "@/features/periods";

export default function useGetTeacherCount() {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useQuery({
    queryKey: ["teacher-count"],
    queryFn: () => {
      if (!selectedPeriod?.id) throw new Error("No period selected");

      return getTeacherCount(selectedPeriod.id);
    },
    enabled: !!selectedPeriod?.id,
  });
}
