import { Calendar } from "lucide-react";

import HeaderPage from "@/components/common/HeaderPage";
import DataPeriods from "@/features/periods/components/DataPeriods";
import { AppLayout } from "@/widgets/layout";

function PeriodsPage() {
  return (
    <AppLayout>
      <HeaderPage title="Periodos Académicos" icon={<Calendar />} />
      <DataPeriods />
    </AppLayout>
  );
}

export default PeriodsPage;
