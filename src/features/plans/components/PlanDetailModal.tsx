import { RefreshCw, X } from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/shared/lib/utils";
import { Avatar, Button, Modal } from "@/shared/ui";
import useClosePlan from "../hooks/useClosePlan";
import useEvaluatePlan from "../hooks/useEvaluatePlan";
import useGetPlan from "../hooks/useGetPlan";
import { isClosed, statusMeta, TARGET_TYPE_LABEL } from "../lib/planStatus";
import type { CloseResult, PlanItem } from "../types/Plan";

const ITEM_STATUS_CLASS: Record<string, string> = {
  PENDIENTE: "bg-ink-100 text-ink-600",
  EN_PROGRESO: "bg-sky-50 text-sky-700",
  CUMPLIDO: "bg-emerald-50 text-emerald-700",
  NO_CUMPLIDO: "bg-brand-50 text-brand-700",
};

const STAGE_LABEL: Record<string, string> = {
  INICIO: "Inicio (firma)",
  MITAD: "Mitad de semestre",
  SEMANA_16: "Semana 16 (cierre)",
};

interface PlanDetailModalProps {
  planId: number | null;
  onClose: () => void;
}

export function PlanDetailModal({ planId, onClose }: PlanDetailModalProps) {
  const { data, isLoading } = useGetPlan(planId);
  const evaluatePlan = useEvaluatePlan();
  const closePlan = useClosePlan();

  const plan = data?.data;

  const handleEvaluate = () => {
    if (!planId) return;
    evaluatePlan.mutate(planId, {
      onSuccess: (res) => {
        const suggestion = res.data?.suggested_result;
        toast.success(
          suggestion
            ? `Resultado calculado. Sugerencia: ${suggestion}.`
            : "Sin notas del periodo de verificación todavía.",
        );
      },
      onError: (error: unknown) =>
        toast.error(
          error instanceof Error ? error.message : "Error al recalcular.",
        ),
    });
  };

  const handleClose = (result: CloseResult) => {
    if (!planId) return;
    closePlan.mutate(
      {
        id: planId,
        data: {
          result,
          reason:
            result === "MANUAL" ? "Cierre manual anticipado" : undefined,
        },
      },
      {
        onSuccess: () => toast.success("Plan cerrado."),
        onError: (error: unknown) =>
          toast.error(
            error instanceof Error ? error.message : "Error al cerrar.",
          ),
      },
    );
  };

  return (
    <Modal open={planId != null} onClose={onClose} widthClass="max-w-2xl">
      {isLoading || !plan ? (
        <div className="p-10 text-center text-[13px] text-ink-500">
          Cargando plan...
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-6">
            <div className="flex items-start gap-3">
              <Avatar
                name={plan.teacher_name ?? "Docente"}
                size={44}
                paletteIndex={plan.teacher_id}
              />
              <div>
                <h3 className="text-[17px] font-semibold text-ink-900">
                  {plan.title}
                </h3>
                <p className="mt-0.5 text-[13px] text-ink-500">
                  {plan.teacher_name} · Origen{" "}
                  {plan.origin_period_code ?? "—"} → Verificación{" "}
                  {plan.verification_period_code ?? "pendiente"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>

          <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={plan.status} />
              {plan.suggested_result && !isClosed(plan.status) && (
                <span className="rounded-full bg-amber-50 px-3 py-1 text-[12px] font-semibold text-amber-700">
                  Sugerencia del sistema: {plan.suggested_result}
                </span>
              )}
              <span className="num text-[13px] font-semibold text-ink-700">
                Progreso {plan.progress}%
              </span>
            </div>

            {plan.description && (
              <p className="text-[13px] leading-snug text-ink-600">
                {plan.description}
              </p>
            )}

            <section>
              <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                Compromisos
              </h4>
              <div className="space-y-2">
                {plan.items.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </div>
            </section>

            {plan.checkpoints.length > 0 && (
              <section>
                <h4 className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-ink-500">
                  Seguimiento en 3 etapas
                </h4>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {plan.checkpoints.map((cp) => (
                    <div
                      key={cp.id}
                      className="rounded-lg border border-ink-200 p-3"
                    >
                      <div className="text-[12.5px] font-semibold text-ink-900">
                        {STAGE_LABEL[cp.stage] ?? cp.stage}
                      </div>
                      <div className="mt-1 text-[11.5px] text-ink-500">
                        {cp.status === "COMPLETADO"
                          ? "Completado"
                          : "Pendiente"}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {!isClosed(plan.status) && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 p-4">
              <Button
                type="button"
                variant="soft"
                size="sm"
                onClick={handleEvaluate}
                disabled={evaluatePlan.isPending}
              >
                <RefreshCw size={14} />
                Recalcular cumplimiento
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleClose("MANUAL")}
                  disabled={closePlan.isPending}
                >
                  Cierre manual
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleClose("NO_CUMPLIDO")}
                  disabled={closePlan.isPending}
                >
                  Cerrar · No cumplió
                </Button>
                <Button
                  type="button"
                  variant="brand"
                  size="sm"
                  onClick={() => handleClose("CUMPLIDO")}
                  disabled={closePlan.isPending}
                >
                  Cerrar · Cumplió
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}

function StatusBadge({ status }: { status: PlanItem["status"] | string }) {
  const meta = statusMeta(status as never);
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-semibold",
        meta.bg,
        meta.text,
        meta.border,
      )}
    >
      {meta.label}
    </span>
  );
}

function ItemRow({ item }: { item: PlanItem }) {
  return (
    <div className="rounded-lg border border-ink-200 p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-ink-900">{item.description}</p>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
            ITEM_STATUS_CLASS[item.status] ?? ITEM_STATUS_CLASS.PENDIENTE,
          )}
        >
          {item.status}
        </span>
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-500">
        <span className="rounded bg-ink-100 px-1.5 py-0.5 font-medium text-ink-600">
          {TARGET_TYPE_LABEL[item.target_type] ?? item.target_type}
          {item.target_ref ? ` · ${item.target_ref}` : ""}
        </span>
        {item.baseline_value != null && (
          <span>Base: {item.baseline_value.toFixed(2)}</span>
        )}
        {item.target_value != null && (
          <span>Meta: ≥ {item.target_value.toFixed(2)}</span>
        )}
        {item.result_value != null && (
          <span className="font-semibold text-ink-700">
            Resultado: {item.result_value.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
