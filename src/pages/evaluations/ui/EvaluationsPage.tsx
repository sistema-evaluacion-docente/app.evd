import { AppLayout } from "@/widgets/layout";
import { EvaluationsContent } from "./EvaluationsContent";

export function EvaluationsPage() {
  return (
    <AppLayout
      header={{ userName: "Director Depto.", userRole: "Ciencias Básicas" }}
    >
      <EvaluationsContent />
    </AppLayout>
  );
}
