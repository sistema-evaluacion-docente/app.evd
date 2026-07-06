import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

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

  const { data: detailRes, isLoading: detailLoading } =
    useGetTeacherEvaluationDetail(evaluation?.id, teacherId);
  const detail = detailRes?.data;

  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between">
        <h2 className="text-[17px] font-semibold text-ink-900">
          Promedio por Dimensión
        </h2>

        <Info size={15} className="text-ink-400" />
      </div>

      {detailLoading ? (
        <ul>
          {[1, 2, 3, 4].map((i) => (
            <li key={i} className="flex items-center justify-between py-3.5">
              <div className="h-3 w-44 animate-pulse rounded bg-ink-100" />
              <div className="h-6 w-14 animate-pulse rounded bg-ink-100" />
            </li>
          ))}
        </ul>
      ) : !detail?.dimensions.length ? (
        <p className="text-[13px] text-ink-400">
          {selectedPeriod
            ? "Sin datos de evaluación para este periodo."
            : "Selecciona un periodo académico."}
        </p>
      ) : (
        <ul className="divide-y divide-ink-100">
          {detail.dimensions.map((dim) => (
            <li
              key={dim.dimension}
              className="flex items-center justify-between py-3.5"
            >
              <span className="text-[13.5px] font-medium text-ink-700">
                {dim.dimension}
              </span>

              <div className="flex items-baseline gap-0.5 tabular-nums">
                <span className="num text-[22px] font-semibold text-ink-900">
                  {dim.average}
                </span>

                <span className="text-[12px] font-medium text-ink-400">
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
