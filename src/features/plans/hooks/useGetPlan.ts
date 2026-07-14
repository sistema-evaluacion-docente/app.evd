import { useQuery } from "@tanstack/react-query";
import getPlan from "../api/getPlan";

export default function useGetPlan(id: number | null) {
  return useQuery({
    queryKey: ["plan", id],
    queryFn: () => getPlan(id as number),
    enabled: id != null,
  });
}
