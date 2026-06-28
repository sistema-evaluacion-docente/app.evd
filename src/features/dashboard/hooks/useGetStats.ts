import { useQuery } from "@tanstack/react-query";

import { usePeriodsStore } from "@/features/periods/store/periodsStore";
import getStats from "../api/getStats";

export default function useGetStats(departmentId?: number) {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useQuery({
    queryKey: ["stats", departmentId, selectedPeriod?.id],
    queryFn: () => getStats(departmentId),
  });
}
