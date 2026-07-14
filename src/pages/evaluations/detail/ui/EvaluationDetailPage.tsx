import { useParams } from "wouter";

import { AppLayout } from "@/widgets/layout";
import EvaluationDetailContent from "./EvaluationDetailContent";

export function EvaluationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const evaluationId = parseInt(id ?? "0", 10);

  return (
    <AppLayout>
      <EvaluationDetailContent evaluationId={evaluationId} />
    </AppLayout>
  );
}
