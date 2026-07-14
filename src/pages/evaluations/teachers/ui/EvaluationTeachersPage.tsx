import { useParams } from "wouter";

import { AppLayout } from "@/widgets/layout";
import EvaluationTeachersContent from "./EvaluationTeachersContent";

export function EvaluationTeachersPage() {
  const { id } = useParams<{ id: string }>();
  const evaluationId = parseInt(id ?? "0", 10);

  return (
    <AppLayout>
      <EvaluationTeachersContent evaluationId={evaluationId} />
    </AppLayout>
  );
}
