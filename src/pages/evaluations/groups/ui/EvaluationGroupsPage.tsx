import { useParams } from "wouter";

import { AppLayout } from "@/widgets/layout";
import EvaluationGroupsContent from "./EvaluationGroupsContent";

export function EvaluationGroupsPage() {
  const { id } = useParams<{ id: string }>();
  const evaluationId = parseInt(id ?? "0", 10);

  return (
    <AppLayout>
      <EvaluationGroupsContent evaluationId={evaluationId} />
    </AppLayout>
  );
}
