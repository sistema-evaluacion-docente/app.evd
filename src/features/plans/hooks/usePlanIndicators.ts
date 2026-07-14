import { useQuery } from "@tanstack/react-query";
import getPlanIndicators from "../api/getPlanIndicators";

/** Static catalogue (dimensions + items of the form): cached for the session. */
export default function usePlanIndicators() {
  return useQuery({
    queryKey: ["plan-indicators"],
    queryFn: getPlanIndicators,
    staleTime: Infinity,
  });
}
