import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";
import { Link } from "wouter";

import KpiCard from "@/features/dashboard/components/KpiCard";
import useAtRiskTeachers from "../hooks/useAtRiskTeachers";

interface CriticalCasesCardProps {
  periodId: number | undefined;
  initialLoading?: boolean;
}

export function CriticalCasesCard({
  periodId,
  initialLoading,
}: CriticalCasesCardProps) {
  const { data, isLoading, isFetched } = useAtRiskTeachers(periodId);

  const atRiskCount = data?.data?.length ?? 0;

  if (initialLoading || isLoading || !isFetched) {
    return (
      <Card className="animate-fade-in">
        <CardContent className="relative">
          <Skeleton className="h-4 w-44 mb-6" />

          <Skeleton className="absolute right-6 top-6 h-8 w-8 opacity-30" />

          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link
      to="/plans"
      className="transition-opacity hover:opacity-80 animate-fade-in"
    >
      <KpiCard
        value={atRiskCount}
        // No period-over-period comparison for this metric; KpiCard hides the
        // trend chip when it isn't positive.
        trend={0}
        progress={100}
        icon={<AlertTriangle size={30} />}
        label="Planes de Mejoramiento"
        progressColor="bg-brand-600"
        trendColor="text-brand-600"
      />
    </Link>
  );
}
