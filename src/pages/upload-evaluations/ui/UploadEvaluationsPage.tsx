import { AppLayout } from "@/widgets/layout";
import UploadEvaluationsContent from "./UploadEvaluationsContent";

export function UploadEvaluationsPage() {
  return (
    <AppLayout
      header={{ userName: "Director Depto.", userRole: "Ciencias Básicas" }}
    >
      <UploadEvaluationsContent />
    </AppLayout>
  );
}
