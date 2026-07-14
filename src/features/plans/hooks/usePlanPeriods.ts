import { useQuery } from "@tanstack/react-query";
import getPlanPeriods from "../api/getPlanPeriods";

export default function usePlanPeriods() {
  return useQuery({
    queryKey: ["plan-periods"],
    queryFn: getPlanPeriods,
    staleTime: 60 * 1000,
  });
}
