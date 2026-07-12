import { AlertTriangle, Award } from "lucide-react";

import type { EvaluationRecord } from "@/features/evaluations";
import useGetTeacherPerformance from "../../hooks/useGetTeacherPerformance";
import TeacherRankingChart from "./TeacherRankingChart";

type Props = {
  evaluation: EvaluationRecord | null;
  initialLoading?: boolean;
};

function TeacherPerformanceSection({ evaluation, initialLoading }: Props) {
  const { data: response, isLoading } = useGetTeacherPerformance();

  const performance = response?.data;

  return (
    <section>
      <div className="grid grid-cols-1 gap-4">
        <TeacherRankingChart
          title="Destacados"
          subtitle="Mayores promedios globales del semestre"
          teachers={performance?.top_5 ?? []}
          barColor="bg-emerald-500"
          barBg="bg-emerald-100"
          scoreColor="text-emerald-600"
          icon={Award}
          isLoading={initialLoading || isLoading}
          evaluationId={evaluation?.id}
        />

        <TeacherRankingChart
          title="Menores promedios"
          subtitle="Menores promedios globales del semestre"
          teachers={performance?.bottom_5 ?? []}
          barColor="bg-red-500"
          barBg="bg-red-100"
          scoreColor="text-red-600"
          icon={AlertTriangle}
          isLoading={initialLoading || isLoading}
          evaluationId={evaluation?.id}
        />
      </div>
    </section>
  );
}

export default TeacherPerformanceSection;
