import TeacherDetailSkeleton from "@/components/skeletons/TeacherDetailSkeleton";
import {
  CourseAveragesCard,
  DimensionAveragesCard,
  HistoricalEvolutionCard,
  NoEvaluationState,
  TeacherCommentsCard,
  TeacherProfileHeader,
  useCurrentTeacherEvaluation,
} from "@/features/evaluations";
import { MyPlanCard } from "@/features/plans";
import { useGetTeacherById } from "@/features/teachers";
import useAuth from "@/shared/hooks/useAuth";

function SummaryContent() {
  const { user } = useAuth();

  const teacherId = user?.teacher_id as number | undefined;

  const { isLoading, isFetching, isFetched } = useGetTeacherById(teacherId);

  const { data: evaluation } = useCurrentTeacherEvaluation(teacherId);

  if ((isLoading || isFetching) && !isFetched) {
    return <TeacherDetailSkeleton />;
  }

  const noData = !isLoading && !isFetching && !isFetched && !evaluation;

  if (!teacherId) {
    return <div>No se encontró el ID del docente.</div>;
  }

  return (
    <>
      <TeacherProfileHeader teacherId={teacherId} evaluation={evaluation} />

      {noData ? (
        <NoEvaluationState />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <DimensionAveragesCard
              teacherId={teacherId}
              evaluation={evaluation}
            />

            <CourseAveragesCard teacherId={teacherId} evaluation={evaluation} />
          </div>

          <TeacherCommentsCard teacherId={teacherId} evaluation={evaluation} />

          <HistoricalEvolutionCard
            teacherId={teacherId}
            evaluation={evaluation}
          />

          <MyPlanCard />
        </>
      )}
    </>
  );
}

export default SummaryContent;
