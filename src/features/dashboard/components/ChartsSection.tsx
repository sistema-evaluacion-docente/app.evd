import { AreaChart } from "@/shared/ui";
import { TrendingUp } from "lucide-react";

import useGetStats from "../hooks/useGetStats";
import type { ChartDataPoint } from "../types/Dashboard";

function computeHistoricalData(stats: ChartDataPoint[]) {
  const sorted = [...stats].sort((a, b) => a.label.localeCompare(b.label));
  const first = sorted[0]?.value ?? 0;
  const last = sorted[sorted.length - 1]?.value ?? 0;
  const delta = last - first;

  return { data: sorted, delta };
}

function ChartsSection() {
  const { data: statsResponse, isLoading } = useGetStats();
  const stats = statsResponse?.data ?? [];

  const historicalData: ChartDataPoint[] = stats.map((s) => ({
    label: s.academic_period_code,
    value: s.global_average ?? 0,
  }));

  const { data: historical, delta } = computeHistoricalData(historicalData);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-ink-200 bg-card p-5 shadow-xs lg:col-span-2">
          <div className="h-48 animate-pulse rounded-lg bg-ink-100" />
        </div>

        <div className="rounded-xl border border-ink-200 bg-card p-5 shadow-xs">
          <div className="h-48 animate-pulse rounded-lg bg-ink-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="rounded-xl border border-ink-200 bg-card p-5 shadow-xs lg:col-span-2">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-ink-900">
              Evolución Histórica
            </h3>

            <p className="mt-0.5 text-[12px] text-ink-500">
              Promedio global del departamento por período académico
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full bg-brand-600" />
              <span className="text-[11px] font-medium text-ink-600">
                Promedio
              </span>
            </div>

            <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
              <TrendingUp size={12} />
              {delta >= 0 ? "+" : ""}
              {delta.toFixed(1)} pts
            </span>
          </div>
        </div>

        <AreaChart
          yMin={0}
          yMax={5}
          data={historical}
          yTicks={[0, 1, 2, 3, 4, 5]}
          formatValue={(v) => v.toString()}
        />
      </div>
    </div>
  );
}

export default ChartsSection;
