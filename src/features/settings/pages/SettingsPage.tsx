import { Settings } from "lucide-react";

import HeaderPage from "@/components/common/HeaderPage";
import DataSettings from "@/features/settings/components/DataSettings";
import { AppLayout } from "@/widgets/layout";

function SettingsPage() {
  return (
    <AppLayout>
      <HeaderPage title="Configuraciones" icon={<Settings />} />
      <DataSettings />
    </AppLayout>
  );
}

export default SettingsPage;
