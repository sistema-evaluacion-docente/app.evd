import { AppLayout } from "@/widgets/layout";

import { LogsContent } from "../components/LogsContent";

export function AdminLogsPage() {
  return (
    <AppLayout
      header={{
        userName: "Super Administrador",
        userRole: "División de Sistemas",
      }}
    >
      <LogsContent />
    </AppLayout>
  );
}
