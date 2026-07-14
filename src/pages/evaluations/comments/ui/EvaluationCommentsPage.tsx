import { useParams } from "wouter";

import { AppLayout } from "@/widgets/layout";
import EvaluationCommentsContent from "./EvaluationCommentsContent";

export function EvaluationCommentsPage() {
  const { id } = useParams<{ id: string }>();
  const evaluationId = parseInt(id ?? "0", 10);

  return (
    <AppLayout>
      <EvaluationCommentsContent evaluationId={evaluationId} />
    </AppLayout>
  );
}
