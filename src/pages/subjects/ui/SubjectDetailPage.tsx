import { useParams } from "wouter";

import { AppLayout } from "@/widgets/layout";
import SubjectDetailContent from "./SubjectDetailContent";

export function SubjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id ?? "0", 10);

  return (
    <AppLayout>
      <SubjectDetailContent courseId={courseId} />
    </AppLayout>
  );
}
