import { FileText } from "lucide-react";
import { Link } from "wouter";

import { Card } from "@/shared/ui";

export function NotFoundState() {
  return (
    <Card className="p-10">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-ink-100">
          <FileText size={24} className="text-ink-400" />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-ink-800">
            Evaluación no encontrada
          </p>

          <p className="mt-1.5 max-w-sm text-[13px] text-ink-500">
            La evaluación solicitada no existe o no está disponible.
          </p>
        </div>

        <Link href="/evaluations">
          <button className="mt-2 rounded-md bg-brand-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-brand-700">
            Volver a Evaluaciones
          </button>
        </Link>
      </div>
    </Card>
  );
}
