import { usePeriodsStore } from "@/features/periods/store/periodsStore";
import useGetCommentsByPeriod from "./useGetCommentsByPeriod";

export default function useGetCommentsByPeriodFromStore({
  page = 1,
  limit = 10,
  search = "",
}: {
  page: number;
  limit: number;
  search: string;
}) {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useGetCommentsByPeriod({
    periodId: Number(selectedPeriod?.id),
    page,
    limit,
    search,
    riskLevel: 2,
  });
}
