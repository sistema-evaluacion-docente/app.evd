import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp } from "lucide-react";

import useGetDepartmentAverage from "../hooks/useGetDepartmentAverage";
import KpiCard from "./KpiCard";
import { Link } from "wouter";

function CardDepartmentAverage() {
  const { data, isLoading } = useGetDepartmentAverage();

  const { global_average, previous_global_average } = data?.data ?? {};

  const globalAverage = Number(global_average ?? 0);
  const prevGlobalAverage = Number(previous_global_average ?? 0);

  if (isLoading) {
    return <Skeleton />;
  }

  return (
    <Link to={`/evaluaciones/`} className="transition-opacity hover:opacity-80">
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
