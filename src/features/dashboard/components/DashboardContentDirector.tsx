import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui";
import { Plus } from "lucide-react";
import { Link } from "wouter";

import TeacherPeriodTable from "@/features/evaluations/components/TeacherPeriodTable";
import CardComments from "./director/CardComments";
import CardDepartmentAverage from "./director/CardDepartmentAverage";
import ChartsSection from "./director/ChartsSection";
import GradeDistributionSection from "./director/GradeDistributionSection";
import RecentCommentsCard from "./director/RecentCommentsCard";
import TeacherPerformanceSection from "./director/TeacherPerformanceSection";

function DashboardContentDirector() {
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
          <CardDepartmentAverage />
          <CardComments />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr] gap-4 items-start">
          <div className="w-full space-y-4">
            <ChartsSection />
            <GradeDistributionSection />
          </div>

          <div className="w-full space-y-4">
            <TeacherPerformanceSection />
            <RecentCommentsCard />
          </div>
        </div>
      </section>

      <TeacherPeriodTable />
    </div>
  );
}

export default DashboardContentDirector;
