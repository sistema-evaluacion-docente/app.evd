import { cn } from "@/shared/lib/utils";

export function ScoreColor({ score }: { score: number }) {
  if (score >= 4.0) return "text-emerald-600";
  if (score >= 3.5) return "text-amber-600";

  return "text-red-600";
}

export function ScoreBarInline({ score, max = 5 }: { score: number; max?: number }) {
  const pct = Math.min(100, (score / max) * 100);

  let color = "bg-emerald-500";
  if (score < 3.5) color = "bg-red-500";
  else if (score < 4.0) color = "bg-amber-500";

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "num text-[15px] font-semibold tabular-nums",
          ScoreColor({ score }),
        )}
      >
        {score.toFixed(2)}
      </span>

      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-ink-100">
        <div
          className={cn("h-full rounded-full", color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
