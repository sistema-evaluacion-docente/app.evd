import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods/store/periodsStore";
import getTeacherPerformance from "../api/getTeacherPerformance";

export default function useGetTeacherPerformance() {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useQuery({
    queryKey: ["teacher-performance", selectedPeriod?.id],
    queryFn: () => {
      if (!selectedPeriod?.id) throw new Error("No period selected");

      return getTeacherPerformance(selectedPeriod.id);
    },
    enabled: !!selectedPeriod?.id,
  });
}
