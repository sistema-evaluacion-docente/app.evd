import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  valueClassName?: string;
  className?: string;
}

/** Compact metric tile: uppercase label, large numeric value, optional sub-text. */
export function StatTile({
  label,
  value,
  sub,
  icon,
  valueClassName,
  className,
}: StatTileProps) {
  return (
    <Card className={cn("p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
          {label}
        </div>

        {icon}
      </div>

      <div
        className={cn(
          "num mt-2.5 text-[28px] font-semibold leading-none tabular-nums",
          valueClassName ?? "text-foreground",
        )}
      >
        {value}
      </div>

      {sub && (
        <div className="mt-2 text-[12px] text-muted-foreground">{sub}</div>
      )}
    </Card>
  );
}
