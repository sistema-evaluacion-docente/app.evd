import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

import { usePeriodsStore } from "@/features/periods";

export default function NoEvaluationState() {
  const { selectedPeriod } = usePeriodsStore();

  return (
    <Card className="p-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink-100">
          <FileText size={24} className="text-ink-400" />
        </div>

        <div>
          <p className="text-[15px] font-semibold text-ink-800">
            Sin evaluación disponible
          </p>

          <p className="mt-1.5 max-w-sm text-[13px] text-ink-500">
            {selectedPeriod ? (
              <>
                Este docente no cuenta con evaluación docente en el periodo
                académico{" "}
                <span className="font-semibold text-ink-700">
                  {selectedPeriod.name}
                </span>
                .
              </>
            ) : (
              "Selecciona un periodo académico en la barra superior."
            )}
          </p>
        </div>
      </div>
    </Card>
  );
}
