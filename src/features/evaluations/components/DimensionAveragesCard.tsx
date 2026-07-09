import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type { EvaluationRecord } from "@/features/evaluations";
import { useGetTeacherEvaluationDetail } from "@/features/evaluations";
import { usePeriodsStore } from "@/features/periods";

interface DimensionAveragesCardProps {
  teacherId: number;
  evaluation?: EvaluationRecord;
}

export default function DimensionAveragesCard({
  teacherId,
  evaluation,
}: DimensionAveragesCardProps) {
  const { selectedPeriod } = usePeriodsStore();

  const { data, isLoading, isFetched } = useGetTeacherEvaluationDetail(
    evaluation?.id,
    teacherId,
  );

  const detail = data?.data;

  if (isLoading || !isFetched) {
    return (
      <Card className="h-full p-5 sm:p-6 animate-fade-in">
        <Skeleton className="mb-5 h-6 w-44" />

        <ul>
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center justify-between py-3.5">
              <Skeleton className="h-3 w-44" />
              <Skeleton className="h-6 w-14" />
            </li>
          ))}
        </ul>
      </Card>
    );
  }

  return (
    <Card className="h-full p-5 sm:p-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <h2 className="text-lg font-semibold">Promedio por Dimensión</h2>
      </div>

      {!detail?.dimensions.length ? (
        <p className="text-muted-foreground">
          {selectedPeriod
            ? "Sin datos de evaluación para este periodo."
            : "Selecciona un periodo académico."}
        </p>
      ) : (
        <ul className="divide-y">
          {detail.dimensions.map((dim) => (
            <li
              key={dim.dimension}
              className="flex items-center justify-between py-3.5"
            >
              <span className="font-medium">{dim.dimension}</span>

              <div className="flex items-baseline gap-0.5 tabular-nums">
                <span className="num text-lg font-semibold">{dim.average}</span>

                <span className="text-sm font-medium text-muted-foreground">
                  /5.0
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
