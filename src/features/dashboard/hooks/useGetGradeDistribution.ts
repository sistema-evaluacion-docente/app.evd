import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods/store/periodsStore";
import getGradeDistribution from "../api/getGradeDistribution";

export default function useGetGradeDistribution(departmentId?: number) {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useQuery({
    queryKey: ["grade-distribution", departmentId, selectedPeriod?.id],
    queryFn: () =>
      getGradeDistribution(selectedPeriod?.id, departmentId, 0.5),
  });
}
