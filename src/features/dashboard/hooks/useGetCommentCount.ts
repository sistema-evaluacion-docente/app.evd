import { useQuery } from "@tanstack/react-query";

import getCommentCount from "../api/getCommentCount";
import { usePeriodsStore } from "@/features/periods/store/periodsStore";

export default function useGetCommentCount() {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useQuery({
    queryKey: ["comment-count", selectedPeriod?.id],
    queryFn: () => {
      if (!selectedPeriod?.id) throw new Error("No period selected");
      return getCommentCount(selectedPeriod.id);
    },
    enabled: !!selectedPeriod?.id,
  });
}
