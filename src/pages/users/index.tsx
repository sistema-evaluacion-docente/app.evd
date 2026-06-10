import HeaderPage from "@/components/common/HeaderPage";
import DataUsers from "@/features/users/components/DataUsers";
import { AppLayout } from "@/widgets/layout";
import { Users } from "lucide-react";

function UsersPage() {
  return (
    <AppLayout>
      <HeaderPage title="Usuarios" icon={<Users />} />
      <DataUsers />
    </AppLayout>
  );
}

export default UsersPage;
