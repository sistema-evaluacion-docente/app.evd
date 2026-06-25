import { AppLayout } from "@/widgets/layout";

import { FacultiesContent } from "../components/FacultiesContent";

export function AdminFacultiesPage() {
  return (
    <AppLayout header={{ userName: "Administrador", userRole: "Admin" }}>
      <FacultiesContent />
    </AppLayout>
  );
}
