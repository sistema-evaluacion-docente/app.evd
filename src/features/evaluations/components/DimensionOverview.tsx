import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, Info } from "lucide-react";

import { Link } from "wouter";
import type { EvaluationDimensionAverage } from "../types/TeacherEvaluation";
import { ScoreBarInline } from "./ScoreBarInline";

interface DimensionOverviewProps {
  dimensions: EvaluationDimensionAverage[];
  evaluationId: number;
}

export function DimensionOverview({
  dimensions,
  evaluationId,
}: DimensionOverviewProps) {
  if (dimensions.length === 0) return null;

  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h2 className="text-[17px] font-semibold text-ink-900">
            Dimensiones de Evaluación
          </h2>
        </div>

        <Link
          href={`/evaluations/${evaluationId}/dimensions`}
          className="flex items-center gap-1 text-[13px] font-medium text-ink-500 hover:text-ink-700"
        >
          Ver más <Info size={16} className="text-ink-400" />
        </Link>
      </div>

      <ul className="divide-y divide-ink-100">
        {dimensions.map((dim) => (
          <li key={dim.dimension}>
            <Collapsible className="group">
              <CollapsibleTrigger className="cursor-pointer flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:bg-ink-50/50 -mx-2 px-2 rounded-md">
                <div className="min-w-0 flex-1">
                  <span className="text-[13.5px] font-medium text-ink-700">
                    {dim.dimension}
                  </span>

                  <span className="ml-2 text-[11px] text-ink-400">
                    {dim.question_count} pregunta
                    {dim.question_count !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {dim.average != null ? (
                    <ScoreBarInline score={dim.average} />
                  ) : (
                    <span className="text-[13px] text-ink-400">—</span>
                  )}

                  <ChevronDown
                    size={16}
                    className="text-ink-400 transition-transform group-data-[expanded]:rotate-180"
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent className="animate-fade-in overflow-hidden data-[expanded]:animate-in data-[collapsed]:animate-out data-[expanded]:slide-in-from-top-2 data-[collapsed]:slide-out-to-top-2">
                <div className="pb-3 pl-4">
                  <ul className="space-y-2 border-l-2 border-ink-100 pl-4">
                    {dim.questions.map((q) => (
                      <li
                        key={q.code}
                        className="flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[11px] font-mono text-ink-400">
                            {q.code}
                          </span>

                          <p className="text-[12.5px] text-ink-600 leading-snug">
                            {q.text}
                          </p>
                        </div>

                        <span
                          className={cn(
                            "shrink-0 text-[12px] font-semibold tabular-nums",
                            q.score >= 4.0
                              ? "text-emerald-600"
                              : q.score >= 3.5
                                ? "text-amber-600"
                                : "text-red-600",
                          )}
                        >
                          {q.score.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </li>
        ))}
      </ul>
    </Card>
  );
}
