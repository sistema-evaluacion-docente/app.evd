import { AlertTriangle } from "lucide-react";
import { useState } from "react";

import { Avatar, Button, Card } from "@/shared/ui";
import useAtRiskTeachers from "../hooks/useAtRiskTeachers";
import { CreatePlanModal } from "./CreatePlanModal";

interface CriticalCasesCardProps {
  periodId: number | undefined;
}

export function CriticalCasesCard({ periodId }: CriticalCasesCardProps) {
  const { data, isLoading } = useAtRiskTeachers(periodId);
  const [modalOpen, setModalOpen] = useState(false);
  const [preselected, setPreselected] = useState<number | undefined>();

  const atRisk = data?.data ?? [];

  const openFor = (teacherId?: number) => {
    setPreselected(teacherId);
    setModalOpen(true);
  };

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700">
            <AlertTriangle size={15} />
          </span>
          <h2 className="text-[14px] font-semibold text-ink-900">
            Casos críticos
          </h2>
          {atRisk.length > 0 && (
            <span className="num rounded-full bg-brand-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              {atRisk.length}
            </span>
          )}
        </div>
        {atRisk.length > 0 && (
          <Button variant="brand-ghost" size="sm" onClick={() => openFor()}>
            Crear plan
          </Button>
        )}
      </div>

      <div className="divide-y divide-ink-100">
        {isLoading && (
          <p className="px-5 py-6 text-center text-[13px] text-ink-500">
            Cargando docentes en riesgo...
          </p>
        )}

        {!isLoading && atRisk.length === 0 && (
          <p className="px-5 py-6 text-center text-[13px] text-ink-500">
            Sin docentes bajo umbral (o todos ya tienen plan) en este periodo.
          </p>
        )}

        {atRisk.map((teacher) => (
          <div
            key={teacher.teacher_id}
            className="flex items-center justify-between gap-3 px-5 py-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <Avatar
                name={teacher.name ?? "Docente"}
                size={36}
                paletteIndex={teacher.teacher_id}
              />
              <div className="min-w-0">
                <div className="truncate text-[13.5px] font-semibold text-ink-900">
                  {teacher.name ?? "Docente"}
                </div>
                <div className="text-[12px] text-ink-500">
                  Promedio{" "}
                  <span className="num font-semibold text-brand-700">
                    {teacher.overall_average.toFixed(2)}
                  </span>{" "}
                  · {teacher.weak_dimensions.length} dimensión(es) baja(s)
                </div>
              </div>
            </div>
            <Button
              variant="soft"
              size="sm"
              onClick={() => openFor(teacher.teacher_id)}
            >
              Crear plan
            </Button>
          </div>
        ))}
      </div>

      <CreatePlanModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        originPeriodId={periodId}
        atRiskTeachers={atRisk}
        preselectedTeacherId={preselected}
      />
    </Card>
  );
}
