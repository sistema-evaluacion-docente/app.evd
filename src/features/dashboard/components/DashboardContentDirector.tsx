import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui";
import { Plus } from "lucide-react";
import { Link } from "wouter";

import { useGetEvaluationByPeriod } from "@/features/evaluations";
import TeacherPeriodTable from "@/features/evaluations/components/TeacherPeriodTable";
import { usePeriodsStore } from "@/features/periods";
import CardComments from "./director/CardComments";
import CardDepartmentAverage from "./director/CardDepartmentAverage";
import ChartsSection from "./director/ChartsSection";
import GradeDistributionSection from "./director/GradeDistributionSection";
import RecentCommentsCard from "./director/RecentCommentsCard";
import TeacherPerformanceSection from "./director/TeacherPerformanceSection";

function DashboardContentDirector() {
  const selectedPeriodId = usePeriodsStore(
    (state) => state.selectedPeriod?.id as number | undefined,
  );

  const { data, isLoading } = useGetEvaluationByPeriod(selectedPeriodId);

  const evaluation = data?.data ?? null;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Panel de Control"
        actions={
          <>
            <Link href="/matrix">
              <Button variant="outline" size="sm" className="gap-2">
                <Plus size={15} strokeWidth={2.25} />
                Ver evaluacion detallada
              </Button>
            </Link>
          </>
        }
      />

      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <CardDepartmentAverage evaluation={evaluation} initialLoading={isLoading} />
          <CardComments evaluation={evaluation} initialLoading={isLoading} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr] gap-4 items-start">
          <div className="w-full space-y-4">
            <ChartsSection />
            <GradeDistributionSection />
          </div>

          <div className="w-full space-y-4">
            <TeacherPerformanceSection evaluation={evaluation} initialLoading={isLoading} />
            <RecentCommentsCard evaluation={evaluation} initialLoading={isLoading} />
          </div>
        </div>
      </section>

      <TeacherPeriodTable />
    </div>
  );
}

export default DashboardContentDirector;
