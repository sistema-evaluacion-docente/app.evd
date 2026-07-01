import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui";
import { Plus } from "lucide-react";
import { Link } from "wouter";

import CardComments from "./CardComments";
import CardDepartmentAverage from "./CardDepartmentAverage";
import ChartsSection from "./ChartsSection";
import GradeDistributionSection from "./GradeDistributionSection";
import TeacherPerformanceSection from "./TeacherPerformanceSection";
import TeacherPeriodTable from "@/features/evaluations/components/TeacherPeriodTable";

function DashboardContent() {
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
          <div className="space-y-4">
            <ChartsSection />
            <GradeDistributionSection />
          </div>

          <TeacherPerformanceSection />
        </div>
      </section>

      <TeacherPeriodTable />
    </div>
  );
}

export default DashboardContent;
