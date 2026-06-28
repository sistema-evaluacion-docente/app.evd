import { Button } from "@/components/ui/button";
import { AreaChart, PageHeader } from "@/shared/ui";
import { Download, Plus, TrendingUp } from "lucide-react";
import { Link } from "wouter";

import useAuth from "@/shared/hooks/useAuth";
import CardComments from "./CardComments";
import CardTeachers from "./CardTeachers";

const historicalData = [
  { label: "2022-1", value: 72 },
  { label: "2022-2", value: 74 },
  { label: "2023-1", value: 77 },
  { label: "2023-2", value: 80 },
  { label: "2024-1", value: 83 },
];

const performanceData = [
  { label: "Sobresaliente (85+)", value: 64, color: "bg-emerald-500" },
  { label: "Satisfactorio (70-84)", value: 48, color: "bg-blue-500" },
  { label: "Aceptable (60-69)", value: 11, color: "bg-amber-500" },
  { label: "Insuficiente (<60)", value: 5, color: "bg-brand-600" },
];

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <CardComments />
        <CardTeachers />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Historical Evolution */}
        <div className="rounded-xl border border-ink-200 bg-card p-5 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-ink-900">
                Evolución Histórica
              </h3>
              <p className="mt-0.5 text-[12px] text-ink-500">
                Promedio global del departamento por período académico
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-brand-600" />
                <span className="text-[11px] font-medium text-ink-600">
                  Promedio
                </span>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                <TrendingUp size={12} />
                +10.9 pts
              </span>
            </div>
          </div>
          <AreaChart
            data={historicalData}
            yMin={60}
            yMax={100}
            yTicks={[60, 70, 80, 90, 100]}
            formatValue={(v) => v.toString()}
          />
        </div>

        {/* Department Status */}
        <div className="rounded-xl border border-ink-200 bg-card p-5 shadow-xs">
          <h3 className="mb-4 text-base font-semibold text-ink-900">
            Estado del Departamento
          </h3>

          {/* Total Progress */}
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
                Avance total evaluación
              </span>
              <span className="text-[12px] font-semibold text-brand-600">
                78%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-ink-100">
              <div className="h-full w-[78%] rounded-full bg-brand-600" />
            </div>
          </div>

          {/* Completed / Pending */}
          <div className="mb-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
              <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-500">
                Finalizadas
              </div>
              <div className="num mt-1 text-xl font-semibold tabular-nums text-ink-900">
                102
              </div>
            </div>
            <div className="rounded-lg border border-ink-200 bg-ink-50 p-3">
              <div className="text-[10px] font-medium uppercase tracking-[0.06em] text-ink-500">
                Pendientes
              </div>
              <div className="num mt-1 text-xl font-semibold tabular-nums text-ink-900">
                26
              </div>
            </div>
          </div>

          {/* Performance Distribution */}
          <div>
            <div className="mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-ink-500">
              Desempeño promedio
            </div>
            <div className="space-y-3">
              {performanceData.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${item.color}`} />
                    <span className="text-[12px] font-medium text-ink-700">
                      {item.label}
                    </span>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    <div className="h-1 w-24 overflow-hidden rounded-full bg-ink-100">
                      <div
                        className={`h-full rounded-full ${item.color}`}
                        style={{ width: `${(item.value / 64) * 100}%` }}
                      />
                    </div>
                    <span className="num w-6 text-right text-[12px] font-semibold tabular-nums text-ink-900">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardContent;
