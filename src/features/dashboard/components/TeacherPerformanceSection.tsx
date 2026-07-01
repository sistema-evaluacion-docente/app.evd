import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, Award } from "lucide-react";

import useGetTeacherPerformance from "../hooks/useGetTeacherPerformance";
import TeacherRankingChart from "./TeacherRankingChart";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

function TeacherPerformanceSection() {
  const { data: response, isLoading } = useGetTeacherPerformance();

  const performance = response?.data;

  if (isLoading) {
    return <Skeleton />;
  }

  if (!performance) return null;

  return (
    <section>
      <div className="grid grid-cols-1 gap-4">
        <TeacherRankingChart
          title="Destacados"
          subtitle="Mayores promedios globales del semestre"
          teachers={performance.top_5}
          barColor="bg-emerald-500"
          barBg="bg-emerald-100"
          scoreColor="text-emerald-600"
          icon={Award}
        />

        <TeacherRankingChart
          title="Menores promedios"
          subtitle="Menores promedios globales del semestre"
          teachers={performance.bottom_5}
          barColor="bg-red-500"
          barBg="bg-red-100"
          scoreColor="text-red-600"
          icon={AlertTriangle}
        />
      </div>
    </section>
  );
}

export default TeacherPerformanceSection;
