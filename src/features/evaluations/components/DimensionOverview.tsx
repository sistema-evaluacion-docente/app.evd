import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { ChevronDown, Info } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

import type { EvaluationDimensionAverage } from "../types/TeacherEvaluation";
import { ScoreBarInline } from "./ScoreBarInline";

interface DimensionOverviewProps {
  dimensions: EvaluationDimensionAverage[];
  evaluationId: number;
  isLoading: boolean;
}

export function DimensionOverview({
  dimensions,
  evaluationId,
  isLoading
}: DimensionOverviewProps) {
  if (isLoading) {
    return (
      <Card className="bg-background p-0 gap-0 animate-fade-in">
        <CardHeader className="mb-0 flex items-start justify-between">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-4 w-16" />
        </CardHeader>

        <CardContent className="p-6">
          <ul className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="flex items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-20" />
                </div>

                <div className="flex items-center gap-2">
                  <Skeleton className="h-3 w-24 rounded-full" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-background p-0 gap-0 animate-fade-in">
      <CardHeader className="mb-0 flex items-start justify-between">
        <CardTitle>
          Dimensiones de Evaluación
        </CardTitle>

        <Link
          href={`/evaluations/${evaluationId}/dimensions`}
          className="flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground"
        >
          Ver más <Info size={16} className="text-muted-foreground" />
        </Link>
      </CardHeader>

      <CardContent className="p-6">
        <ul className="divide-y">
          {dimensions.map((dim) => (
            <li key={dim.dimension}>
              <Collapsible className="group">
                <CollapsibleTrigger className="cursor-pointer flex w-full items-center justify-between gap-4 py-3.5 text-left transition-colors hover:bg-muted -mx-2 px-2 rounded-md">
                  <div className="min-w-0 flex-1">
                    <span className="font-medium">
                      {dim.dimension}
                    </span>

                    <span className="ml-2 text-xs text-muted-foreground">
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
                    <ul className="space-y-2 border-l-2 pl-4">
                      {dim.questions.map((q) => (
                        <li
                          key={q.code}
                          className="flex items-start justify-between gap-3"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-mono text-muted-foreground">
                              {q.code}
                            </span>

                            <p className="text-sm text-muted-foreground leading-snug">
                              {q.text}
                            </p>
                          </div>

                          <span
                            className={cn(
                              "shrink-0 text-xs font-semibold tabular-nums",
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
      </CardContent>
    </Card>
  );
}
