import { RefreshCw } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/shared/lib/utils";
import { Avatar } from "@/shared/ui";
import useClosePlan from "../hooks/useClosePlan";
import useEvaluatePlan from "../hooks/useEvaluatePlan";
import useGetPlan from "../hooks/useGetPlan";
import usePlanIndicators from "../hooks/usePlanIndicators";
import { isClosed, statusMeta, TARGET_TYPE_LABEL } from "../lib/planStatus";
import type { CloseResult, PlanItem } from "../types/Plan";

const ITEM_STATUS_CLASS: Record<string, string> = {
  PENDIENTE: "bg-muted text-muted-foreground",
  EN_PROGRESO: "bg-sky-50 text-sky-700",
  CUMPLIDO:
    "bg-emerald-50 text-emerald-700",
  NO_CUMPLIDO:
    "bg-brand-50 text-brand-700",
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
  const { data: indicatorsData } = usePlanIndicators();
  const evaluatePlan = useEvaluatePlan();
  const closePlan = useClosePlan();

  const plan = data?.data;

  // Item-level commitments are stored as a question code ("011"): resolve the
  // text so the compromiso is readable without opening the form.
  const questionText = useMemo(() => {
    const texts = new Map<string, string>();
    indicatorsData?.data?.dimensions.forEach((dimension) =>
      dimension.questions.forEach((question) =>
        texts.set(question.code, question.text),
      ),
    );
    return texts;
  }, [indicatorsData]);

  // The three close buttons share one mutation, so `isPending` alone would spin
  // all of them. The in-flight variables tell us which one was actually clicked.
  const closingResult = closePlan.isPending
    ? closePlan.variables?.data.result
    : undefined;

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
          reason: result === "MANUAL" ? "Cierre manual anticipado" : undefined,
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
    <Dialog
      open={planId != null}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="sm:max-w-2xl">
        {isLoading || !plan ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-11 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-56" />
                <Skeleton className="h-3 w-72" />
              </div>
            </div>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start gap-3 pr-8">
                <Avatar
                  name={plan.teacher_name ?? "Docente"}
                  size={44}
                  paletteIndex={plan.teacher_id}
                />

                <div className="min-w-0">
                  <DialogTitle>{plan.title}</DialogTitle>

                  <DialogDescription className="mt-1">
                    {plan.teacher_name} · Origen{" "}
                    {plan.origin_period_code ?? "—"} → Verificación{" "}
                    {plan.verification_period_code ?? "pendiente"}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status={plan.status} />

                {plan.suggested_result && !isClosed(plan.status) && (
                  <Badge className="bg-amber-50 text-amber-700">
                    Sugerencia del sistema: {plan.suggested_result}
                  </Badge>
                )}

                <span className="num text-[13px] font-semibold text-foreground">
                  Progreso {plan.progress}%
                </span>
              </div>

              {plan.description && (
                <p className="text-[13px] leading-snug text-muted-foreground">
                  {plan.description}
                </p>
              )}

              <section>
                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Compromisos
                </h4>

                <div className="space-y-2">
                  {plan.items.map((item) => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      questionText={questionText}
                    />
                  ))}
                </div>
              </section>

              {plan.checkpoints.length > 0 && (
                <section>
                  <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Seguimiento en 3 etapas
                  </h4>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    {plan.checkpoints.map((cp) => (
                      <div key={cp.id} className="rounded-lg border p-3">
                        <div className="text-[12.5px] font-semibold text-foreground">
                          {STAGE_LABEL[cp.stage] ?? cp.stage}
                        </div>

                        <div className="mt-1 text-[11.5px] text-muted-foreground">
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
              <DialogFooter className="sm:justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleEvaluate}
                  disabled={evaluatePlan.isPending}
                >
                  {evaluatePlan.isPending ? (
                    <Spinner />
                  ) : (
                    <RefreshCw className="size-4" />
                  )}
                  {evaluatePlan.isPending
                    ? "Recalculando..."
                    : "Recalcular cumplimiento"}
                </Button>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleClose("MANUAL")}
                    disabled={closePlan.isPending}
                  >
                    {closingResult === "MANUAL" && <Spinner />}
                    Cierre manual
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleClose("NO_CUMPLIDO")}
                    disabled={closePlan.isPending}
                  >
                    {closingResult === "NO_CUMPLIDO" && <Spinner />}
                    Cerrar · No cumplió
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleClose("CUMPLIDO")}
                    disabled={closePlan.isPending}
                  >
                    {closingResult === "CUMPLIDO" && <Spinner />}
                    Cerrar · Cumplió
                  </Button>
                </div>
              </DialogFooter>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: PlanItem["status"] | string }) {
  const meta = statusMeta(status as never);

  return (
    <Badge className={cn("border", meta.bg, meta.text, meta.border)}>
      {meta.label}
    </Badge>
  );
}

function ItemRow({
  item,
  questionText,
}: {
  item: PlanItem;
  questionText: Map<string, string>;
}) {
  const target =
    item.target_type === "QUESTION" && item.target_ref
      ? `${item.target_ref} · ${questionText.get(item.target_ref) ?? ""}`
      : item.target_ref;

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] text-foreground">{item.description}</p>

        <Badge
          className={cn(
            "shrink-0",
            ITEM_STATUS_CLASS[item.status] ?? ITEM_STATUS_CLASS.PENDIENTE,
          )}
        >
          {item.status}
        </Badge>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
        <span className="rounded bg-muted px-1.5 py-0.5 font-medium">
          {TARGET_TYPE_LABEL[item.target_type] ?? item.target_type}
          {target ? ` · ${target}` : ""}
        </span>

        {item.baseline_value != null && (
          <span>Base: {item.baseline_value.toFixed(2)}</span>
        )}

        {item.target_value != null && (
          <span>Meta: ≥ {item.target_value.toFixed(2)}</span>
        )}

        {item.result_value != null && (
          <span className="font-semibold text-foreground">
            Resultado: {item.result_value.toFixed(2)}
          </span>
        )}
      </div>
    </div>
  );
}
