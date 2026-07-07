import TeacherDetailSkeleton from "@/components/skeletons/TeacherDetailSkeleton";
import {
  CourseAveragesCard,
  DimensionAveragesCard,
  HistoricalEvolutionCard,
  ImprovementPlanCard,
  NoEvaluationState,
  TeacherCommentsCard,
  TeacherProfileHeader,
  useCurrentTeacherEvaluation,
} from "@/features/evaluations";
import { useGetTeacherById } from "@/features/teachers";

type Props = {
  teacherId: number;
};

function TeacherDetailContent({ teacherId }: Props) {
  const { isLoading, isFetching, isFetched } = useGetTeacherById(teacherId);

  const { data: evaluation } = useCurrentTeacherEvaluation(teacherId);

  if ((isLoading || isFetching) && !isFetched) {
    return <TeacherDetailSkeleton />;
  }

  const noData = !isLoading && !isFetching && !isFetched && !evaluation;

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

          <ImprovementPlanCard />
        </>
      )}
    </>
  );
}

export default TeacherDetailContent;
