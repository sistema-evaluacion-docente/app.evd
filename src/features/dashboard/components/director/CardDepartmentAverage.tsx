import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";
import { Link } from "wouter";

import useGetDepartmentAverage from "../../hooks/useGetDepartmentAverage";
import KpiCard from "../KpiCard";

function CardDepartmentAverage() {
  const { data, isLoading, isFetched } = useGetDepartmentAverage();

  const { global_average, previous_global_average } = data?.data ?? {};

  const globalAverage = Number(global_average ?? 0);
  const prevGlobalAverage = Number(previous_global_average ?? 0);

  if (isLoading || !isFetched) {
    return (
      <Card className="animate-fade-in">
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
      to={`/evaluaciones`}
      className="transition-opacity hover:opacity-80 animate-fade-in"
    >
      <KpiCard
        value={globalAverage.toFixed(2)}
        trend={parseFloat((globalAverage - prevGlobalAverage)?.toFixed(2)) ?? 0}
        trendColor="text-brand-600"
        progress={globalAverage * 20}
        icon={<TrendingUp size={30} />}
        label="Promedio Departamento"
        progressColor="bg-brand-600"
      />
    </Link>
  );
}

export default CardDepartmentAverage;
