import { AppLayout } from "@/widgets/layout";

import { DepartmentsContent } from "../components/DepartmentsContent";

export function AdminDepartmentsPage() {
  return (
    <AppLayout header={{ userName: "Administrador", userRole: "Admin" }}>
      <DepartmentsContent />
    </AppLayout>
  );
}
