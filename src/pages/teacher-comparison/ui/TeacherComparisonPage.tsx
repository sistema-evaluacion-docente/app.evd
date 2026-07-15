import { useParams } from "wouter";

import { AppLayout } from "@/widgets/layout";
import TeacherComparisonContent from "@/features/teachers/componentes/TeacherComparisonContent";

export function TeacherComparisonPage() {
  const { id } = useParams<{ id: string }>();
  const teacherId = parseInt(id ?? "0", 10);

  return (
    <AppLayout header={{}}>
      <TeacherComparisonContent teacherId={teacherId} />
    </AppLayout>
  );
}
