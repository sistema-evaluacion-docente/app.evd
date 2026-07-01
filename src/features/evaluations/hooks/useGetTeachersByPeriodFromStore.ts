import { usePeriodsStore } from "@/features/periods/store/periodsStore";
import useGetTeachersByPeriod from "./useGetTeachersByPeriod";

export default function useGetTeachersByPeriodFromStore({
  page = 1,
  limit = 10,
  search = "",
}: {
  page: number;
  limit: number;
  search: string;
}) {
  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  return useGetTeachersByPeriod({
    periodId: Number(selectedPeriod?.id),
    page,
    limit,
    search,
  });
}
