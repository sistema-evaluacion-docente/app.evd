import { useParams } from "wouter";

import { AppLayout } from "@/widgets/layout";
import TeacherDetailContent from "./TeacherDetailContent";

export function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teacherId = parseInt(id ?? "0", 10);

  return (
    <AppLayout header={{}}>
      <TeacherDetailContent teacherId={teacherId} />
    </AppLayout>
  );
}
