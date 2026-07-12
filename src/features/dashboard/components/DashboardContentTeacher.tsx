import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui";
import { Plus } from "lucide-react";
import { Link } from "wouter";

import CardTeacherAverage from "./teacher/CardTeacherAverage";
import CardTeacherComments from "./teacher/CardTeacherComments";
import TeacherChartsSection from "./teacher/TeacherChartsSection";
import TeacherCommentsBySubject from "./teacher/TeacherCommentsBySubject";
import TeacherCoursesChart from "./teacher/TeacherCoursesChart";
import TeacherDimensionAverages from "./teacher/TeacherDimensionAverages";

function DashboardContentTeacher() {
  return (
    <div className="space-y-5">
      <PageHeader
        title="Mi evaluación"
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
          <CardTeacherAverage />
          <CardTeacherComments />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_0.5fr] gap-4 items-start">
          <div className="w-full space-y-4">
            <TeacherChartsSection />
            <TeacherDimensionAverages />
          </div>

          <div className="w-full space-y-4">
            <TeacherCoursesChart />
            <TeacherCommentsBySubject />
          </div>
        </div>
      </section>
    </div>
  );
}

export default DashboardContentTeacher;
