import { useQuery } from "@tanstack/react-query";
import getMyPlans from "../api/getMyPlans";

export default function useMyPlans(enabled = true) {
  return useQuery({
    queryKey: ["my-plans"],
    queryFn: getMyPlans,
    enabled,
  });
}
