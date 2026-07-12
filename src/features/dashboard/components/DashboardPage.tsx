import { AppLayout } from "@/widgets/layout";
import DashboardContent from "./DashboardContent";

export function DashboardPage() {
  return (
    <AppLayout
      header={{ userName: "Director Depto.", userRole: "Ciencias Básicas" }}
    >
      <DashboardContent />
    </AppLayout>
  );
}
