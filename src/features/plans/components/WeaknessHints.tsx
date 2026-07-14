import { Check, Plus } from "lucide-react";

import { cn } from "@/shared/lib/utils";
import { CRITICAL_SCORE, format, targetKey } from "../lib/draft";
import type { PlanCandidate } from "../types/Plan";

interface WeaknessHintsProps {
  teacher: PlanCandidate;
  threshold: number;
  /** Indicators already committed to, as `DIMENSION:<name>` / `QUESTION:<code>`. */
  taken: Set<string>;
  onAdd: (
    dimension: string,
    code: string | null,
    text: string,
    average: number | null,
    suggestion: string | undefined,
  ) => void;
}

/** One-click commitments for what this teacher is actually failing. */
export function WeaknessHints({
  teacher,
  threshold,
  taken,
  onAdd,
}: WeaknessHintsProps) {
  const { weak_dimensions: dimensions, weak_questions: questions } = teacher;

  if (dimensions.length === 0 && questions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        {teacher.name} no está por debajo de {threshold} en ninguna dimensión ni
        ítem. Puedes crear el plan igualmente eligiendo el indicador a mejorar.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
      <p className="text-xs font-semibold text-foreground">
        Debilidades detectadas (por debajo de {threshold})
      </p>

      {dimensions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Categorías generales
          </p>

          <div className="flex flex-wrap gap-1.5">
            {dimensions.map((dim) => (
              <HintChip
                key={dim.dimension}
                label={`${dim.dimension} · ${format(dim.average)}`}
                average={dim.average}
                isDimension
                taken={taken.has(targetKey("DIMENSION", dim.dimension))}
                onClick={() =>
                  onAdd(
                    dim.dimension,
                    null,
                    `Mejorar la dimensión ${dim.dimension}.`,
                    dim.average,
                    dim.suggestions[0],
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Ítems específicos
          </p>

          <div className="flex flex-wrap gap-1.5">
            {questions.map((question) => (
              <HintChip
                key={question.code}
                label={`${question.code} · ${question.text} · ${format(question.average)}`}
                average={question.average}
                taken={taken.has(targetKey("QUESTION", question.code))}
                onClick={() =>
                  onAdd(
                    question.dimension,
                    question.code,
                    question.text,
                    question.average,
                    question.suggestions[0],
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Red flags a critical score (< 3) wherever it appears; the rest is tinted by
 * what it is — blue for a whole category, amber for a single item.
 */
function chipTone(average: number | null, isDimension: boolean, taken: boolean) {
  if (taken) {
    return "cursor-not-allowed border-border bg-muted text-muted-foreground";
  }

  if (average != null && average < CRITICAL_SCORE) {
    return "cursor-pointer border-brand-200/70 bg-brand-50 text-brand-700 hover:bg-brand-100";
  }

  if (isDimension) {
    return "cursor-pointer border-sky-200/70 bg-sky-50 text-sky-700 hover:bg-sky-100";
  }

  return "cursor-pointer border-amber-200/70 bg-amber-50 text-amber-700 hover:bg-amber-100";
}

function HintChip({
  label,
  average,
  isDimension = false,
  taken,
  onClick,
}: {
  label: string;
  average: number | null;
  isDimension?: boolean;
  taken: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={taken}
      aria-pressed={taken}
      title={taken ? "Ya está en los compromisos del plan" : undefined}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] transition-colors",
        chipTone(average, isDimension, taken),
      )}
    >
      {taken ? <Check className="size-3" /> : <Plus className="size-3" />}
      <span className="max-w-88 truncate">{label}</span>
    </button>
  );
}
