import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AreaChart } from "@/shared/ui";
import { TrendingUp } from "lucide-react";

import useGetStats from "../hooks/useGetStats";
import type { ChartDataPoint } from "../types/Dashboard";
import GradeDistributionSection from "./GradeDistributionSection";

function computeHistoricalData(stats: ChartDataPoint[]) {
  const sorted = [...stats].sort((a, b) => a.label.localeCompare(b.label));
  const first = sorted[0]?.value ?? 0;
  const last = sorted[sorted.length - 1]?.value ?? 0;
  const delta = last - first;

  return { data: sorted, delta };
}

function ChartsSection() {
  const { data: statsResponse, isLoading, isFetched } = useGetStats();

  const stats = statsResponse?.data ?? [];

  const historicalData: ChartDataPoint[] = stats.map((s) => ({
    label: s.academic_period_code,
    value: s.global_average ?? 0,
  }));

  const { data: historical, delta } = computeHistoricalData(historicalData);

  if (isLoading || !isFetched) {
    return (
      <Card className="pt-0">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>

        <CardContent>
          <div className="mb-4 flex items-center justify-end">
            <div className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>

          <Skeleton className="h-75 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="grid grid-cols-1 gap-4">
        <Card className="pt-0">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Evolución Histórica</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="mb-4 flex items-center justify-end">
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
          </CardContent>
        </Card>
      </div>

      <GradeDistributionSection />
    </section>
  );
}

export default ChartsSection;
