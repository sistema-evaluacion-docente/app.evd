import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { Link } from "wouter";

import useGetTeacherAverage from "../../hooks/useGetTeacherAverage";
import KpiCard from "../KpiCard";

function CardTeacherAverage() {
  const { data, isLoading, isFetched } = useGetTeacherAverage();

  const { overall_average, previous_overall_average } = data?.data ?? {};

  const overallAverage = Number(overall_average ?? 0);
  const prevOverallAverage = Number(previous_overall_average ?? 0);

  if (isLoading || !isFetched) {
    return (
      <Card>
        <CardContent className="relative">
          <Skeleton className="h-4 w-40 mb-6" />

          <Skeleton className="absolute right-6 top-6 h-8 w-8 opacity-30" />

          <div className="flex items-center gap-4">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-6 w-12" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Link
      to={`/matrix`}
      className="transition-opacity hover:opacity-80 animate-fade-in"
    >
      <KpiCard
        value={overallAverage.toFixed(2)}
        trend={
          parseFloat((overallAverage - prevOverallAverage)?.toFixed(2)) ?? 0
        }
        trendColor="text-brand-600"
        progress={overallAverage * 20}
        icon={<TrendingUp size={30} />}
        label="Mi Promedio"
        progressColor="bg-brand-600"
      />
    </Link>
  );
}

export default CardTeacherAverage;
