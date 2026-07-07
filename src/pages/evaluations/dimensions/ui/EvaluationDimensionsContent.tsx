import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { StatTile } from "@/shared/ui";
import { Info } from "lucide-react";

import { NotFoundState, ScoreBarInline } from "@/features/evaluations";
import { useEvaluationDimensions } from "../model/useEvaluationDimensions";
import EvaluationDimensionsSkeleton from "./EvaluationDimensionsSkeleton";

type Props = {
  evaluationId: number;
};

function EvaluationDimensionsContent({ evaluationId }: Props) {
  const {
    evaluation,
    dimensions,
    overallAverage,
    totalQuestions,
    isLoading,
    noData,
  } = useEvaluationDimensions(evaluationId);

  if (isLoading) {
    return <EvaluationDimensionsSkeleton />;
  }

  return (
    <>
      {noData ? (
        <NotFoundState />
      ) : (
        <>
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
            <div>
              <h1 className="text-2xl font-semibold leading-tight tracking-tight text-ink-900">
                Dimensiones de Evaluación:
                <span className="ml-2 text-primary">
                  {evaluation?.academic_period_name}
                </span>
              </h1>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatTile
              label="Promedio General"
              value={overallAverage != null ? overallAverage.toFixed(2) : "—"}
              sub="/5.0"
              icon={<Info size={16} className="text-emerald-600" />}
            />

            <StatTile
              label="Total Dimensiones"
              value={dimensions.length}
              icon={<Info size={16} className="text-brand-600" />}
            />

            <StatTile
              label="Total Preguntas"
              value={totalQuestions}
              icon={<Info size={16} className="text-ink-400" />}
            />
          </div>

          {dimensions.length === 0 ? (
            <Card className="p-10">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink-100">
                  <Info size={24} className="text-ink-400" />
                </div>

                <div>
                  <p className="text-[15px] font-semibold text-ink-800">
                    Sin dimensiones disponibles
                  </p>

                  <p className="mt-1.5 max-w-sm text-[13px] text-ink-500">
                    Esta evaluación no cuenta con datos de dimensiones.
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-5">
              {dimensions.map((dim) => (
                <div key={dim.dimension}>
                  <div className="bg-background border rounded-lg p-4 mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div>
                      <h2 className="text-[17px] font-semibold text-ink-900">
                        {dim.dimension}
                      </h2>

                      <p className="mt-0.5 text-[12px] text-ink-500">
                        {dim.question_count} pregunta
                        {dim.question_count !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {dim.average != null ? (
                      <ScoreBarInline score={dim.average} />
                    ) : (
                      <span className="text-[13px] text-ink-400">—</span>
                    )}
                  </div>

                  <div className="overflow-hidden rounded-lg border border-ink-200">
                    <table className="w-full text-left">
                      <thead className="bg-ink-50">
                        <tr>
                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                            Código
                          </th>

                          <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                            Pregunta
                          </th>

                          <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-500">
                            Puntaje
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-ink-100 bg-white">
                        {dim.questions.map((q) => (
                          <tr
                            key={q.code}
                            className="transition-colors hover:bg-ink-50/50"
                          >
                            <td className="px-4 py-3 align-top">
                              <span className="font-mono text-[11px] text-ink-500">
                                {q.code}
                              </span>
                            </td>

                            <td className="px-4 py-3 align-top">
                              <p className="text-[13px] leading-snug text-ink-700">
                                {q.text}
                              </p>
                            </td>

                            <td className="px-4 py-3 align-top text-right">
                              <span
                                className={cn(
                                  "inline-flex min-w-14 justify-end text-[13px] font-semibold tabular-nums",
                                  q.score >= 4.0
                                    ? "text-emerald-600"
                                    : q.score >= 3.5
                                      ? "text-amber-600"
                                      : "text-red-600",
                                )}
                              >
                                {q.score.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

export default EvaluationDimensionsContent;
