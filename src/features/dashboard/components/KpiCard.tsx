import { TrendingUp } from "lucide-react";

function KpiCard({
  label,
  value,
  icon,
  trend,
  trendColor = "text-emerald-600",
  progress,
  progressColor = "bg-blue-500",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: string;
  progress?: number;
  progressColor?: string;
}) {
  return (
    <div className="rounded-xl border border-ink-200 bg-card p-5 shadow-xs">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-50 text-ink-600">
          {icon}
        </div>

        {trend && (
          <span
            className={`flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold ${trendColor}`}
          >
            <TrendingUp size={12} />
            {trend}
          </span>
        )}
      </div>

      <div className="mt-4 text-[12px] font-medium text-ink-500">{label}</div>

      <div className="num mt-1.5 text-[28px] font-semibold leading-none tabular-nums text-ink-900">
        {value}
      </div>

      {progress !== undefined && (
        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-ink-100">
          <div
            className={`h-full rounded-full transition-all ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

export default KpiCard;
