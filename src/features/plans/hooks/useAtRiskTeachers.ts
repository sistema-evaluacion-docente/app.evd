import { useQuery } from "@tanstack/react-query";
import getAtRiskTeachers from "../api/getAtRiskTeachers";

export default function useAtRiskTeachers(periodId: number | undefined) {
  return useQuery({
    queryKey: ["at-risk", periodId],
    queryFn: () => getAtRiskTeachers({ period_id: periodId as number }),
    enabled: periodId != null,
    staleTime: 60 * 1000,
  });
}
