import { ArrowRight } from "lucide-react";
import { Link, useParams } from "wouter";

import { useGetTeacherById } from "@/features/teachers";
import {
  useCurrentTeacherEvaluation,
  TeacherProfileHeader,
  DimensionAveragesCard,
  CourseAveragesCard,
  TeacherCommentsCard,
  HistoricalEvolutionCard,
  ImprovementPlanCard,
  NoEvaluationState,
} from "@/features/evaluations";
import { usePeriodsStore } from "@/features/periods";
import { AppFooter } from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teacherId = parseInt(id ?? "0", 10);
  const { selectedPeriod } = usePeriodsStore();

  const { data: teacherRes, isLoading } = useGetTeacherById(teacherId);
  const { data: evaluation } = useCurrentTeacherEvaluation(teacherId);

  const teacherName = teacherRes?.data?.user?.name ?? "—";
  const periodLabel = selectedPeriod?.name ?? "—";
  const noData = !isLoading && !evaluation;

  return (
    <AppLayout
      header={{
        rightMode: "periodo",
        showBreadcrumb: true,
        breadcrumb: (
          <>
            <Link
              href='/teachers'
              className='shrink-0 transition-colors hover:text-ink-900'
            >
              Directorio
            </Link>
            <ArrowRight size={12} className='shrink-0 text-ink-300' />
            <span className='truncate font-medium text-ink-900'>
              {teacherName}
            </span>
          </>
        ),
      }}
    >
      <TeacherProfileHeader teacherId={teacherId} evaluation={evaluation} />

      {noData ? (
        <NoEvaluationState />
      ) : (
        <>
          <div className='grid grid-cols-1 gap-5 lg:grid-cols-2'>
            <DimensionAveragesCard teacherId={teacherId} evaluation={evaluation} />
            <CourseAveragesCard teacherId={teacherId} evaluation={evaluation} />
          </div>

          <TeacherCommentsCard teacherId={teacherId} evaluation={evaluation} />
          <HistoricalEvolutionCard teacherId={teacherId} evaluation={evaluation} />
          <ImprovementPlanCard />
        </>
      )}

      <AppFooter>
        {periodLabel} · Sistema de Evaluación Docente · v2.1
      </AppFooter>
    </AppLayout>
  );
}
