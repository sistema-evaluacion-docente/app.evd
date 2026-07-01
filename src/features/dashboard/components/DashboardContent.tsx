import { Button } from "@/components/ui/button";
import { PageHeader } from "@/shared/ui";
import { Download, Plus } from "lucide-react";
import { Link } from "wouter";

import useAuth from "@/shared/hooks/useAuth";
import CardComments from "./CardComments";
import CardDepartmentAverage from "./CardDepartmentAverage";
import ChartsSection from "./ChartsSection";
import TeacherPerformanceSection from "./TeacherPerformanceSection";

function DashboardContent() {
  const { user } = useAuth();

  return (
    <div className="space-y-5">
      <PageHeader
        title="Panel de Control"
        description={`Bienvenido, ${user?.name}.`}
        actions={
          <>
            <Button variant="outline">
              <Download size={15} />
              Descargar Informe
            </Button>

            <Link href="/upload-evaluations">
              <Button>
                <Plus size={15} strokeWidth={2.25} />
                Nueva Evaluación
              </Button>
            </Link>
          </>
        }
      />

      <section className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          <CardDepartmentAverage />
          <CardComments />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_0.5fr] gap-4 items-start">
          <ChartsSection />
          <TeacherPerformanceSection />
        </div>
      </section>
    </div>
  );
}

export default DashboardContent;
