import { useParams } from "wouter";

import { AppLayout } from "@/widgets/layout";
import EvaluationDimensionsContent from "./EvaluationDimensionsContent";

export function EvaluationDimensionsPage() {
  const { id } = useParams<{ id: string }>();

  const evaluationId = parseInt(id ?? "0", 10);

  return (
    <AppLayout>
      <EvaluationDimensionsContent evaluationId={evaluationId} />
    </AppLayout>
  );
}
