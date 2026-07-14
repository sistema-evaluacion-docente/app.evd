import { ExternalLink, FileText, Plus, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAddEvidence, useDeleteEvidence } from "../hooks/useEvidences";
import { uploadedFileUrl } from "../lib/fileUrl";
import { isClosed } from "../lib/planStatus";
import type { Plan, PlanEvidence } from "../types/Plan";

/** Sentinel for "the plan as a whole" in the item select. */
const WHOLE_PLAN = "__PLAN__";

interface EvidencesSectionProps {
  plan: Plan;
  /** DB id of the authenticated user, to offer deleting their own uploads. */
  currentUserId: number | null;
  /** Directors/admins can delete any evidence of the plan. */
  canManage: boolean;
}

/** Evidencias de cumplimiento: PDFs que el docente (o el director) adjunta. */
export function EvidencesSection({
  plan,
  currentUserId,
  canManage,
}: EvidencesSectionProps) {
  const addEvidence = useAddEvidence();
  const deleteEvidence = useDeleteEvidence();
  const inputRef = useRef<HTMLInputElement>(null);

  const [adding, setAdding] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [itemId, setItemId] = useState<string>(WHOLE_PLAN);

  const open = !isClosed(plan.status);

  const itemOptions = useMemo(
    () => [
      { value: WHOLE_PLAN, label: "El plan en general" },
      ...plan.items.map((item, index) => ({
        value: String(item.id),
        label: `Compromiso ${index + 1}: ${item.description.slice(0, 60)}`,
      })),
    ],
    [plan.items],
  );

  const itemLabel = (evidence: PlanEvidence) => {
    if (evidence.item_id == null) return null;
    const index = plan.items.findIndex((item) => item.id === evidence.item_id);
    return index >= 0 ? `Compromiso ${index + 1}` : "Compromiso eliminado";
  };

  const reset = () => {
    setAdding(false);
    setFile(null);
    setDescription("");
    setItemId(WHOLE_PLAN);
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Selecciona el PDF de la evidencia.");
      return;
    }

    addEvidence.mutate(
      {
        planId: plan.id,
        file,
        description: description.trim() || undefined,
        itemId: itemId === WHOLE_PLAN ? null : Number(itemId),
      },
      {
        onSuccess: () => {
          toast.success("Evidencia agregada.");
          reset();
        },
        onError: (error: unknown) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "Error al subir la evidencia.",
          ),
      },
    );
  };

  const handleDelete = (evidence: PlanEvidence) => {
    deleteEvidence.mutate(
      { planId: plan.id, evidenceId: evidence.id },
      {
        onSuccess: () => toast.success("Evidencia eliminada."),
        onError: (error: unknown) =>
          toast.error(
            error instanceof Error
              ? error.message
              : "Error al eliminar la evidencia.",
          ),
      },
    );
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Evidencias de cumplimiento
        </h4>

        {open && !adding && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setAdding(true)}
          >
            <Plus className="size-3.5" />
            Subir evidencia
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {plan.evidences.map((evidence) => {
          const url = uploadedFileUrl(evidence.file_url);
          const deletable =
            open &&
            (canManage ||
              (currentUserId != null &&
                evidence.uploaded_by === currentUserId));

          return (
            <div key={evidence.id} className="rounded-lg border p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  {url && (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:underline"
                    >
                      <ExternalLink className="size-3.5" />
                      Ver evidencia (PDF)
                    </a>
                  )}

                  {evidence.description && (
                    <p className="text-[13px] leading-snug text-muted-foreground">
                      {evidence.description}
                    </p>
                  )}

                  <p className="text-[11.5px] text-muted-foreground">
                    {evidence.uploader_name ?? "—"}
                    {evidence.created_at &&
                      ` · ${new Date(evidence.created_at).toLocaleDateString()}`}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {itemLabel(evidence) && (
                    <Badge className="bg-muted text-muted-foreground">
                      {itemLabel(evidence)}
                    </Badge>
                  )}

                  {deletable && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(evidence)}
                      disabled={deleteEvidence.isPending}
                      aria-label="Eliminar evidencia"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {plan.evidences.length === 0 && !adding && (
          <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
            {open
              ? "Aún no hay evidencias. Sube un PDF que respalde el avance de los compromisos."
              : "El plan se cerró sin evidencias registradas."}
          </p>
        )}

        {adding && (
          <div className="space-y-3 rounded-lg border p-3">
            <div className="space-y-1.5">
              <Label className="text-xs">PDF de la evidencia</Label>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => inputRef.current?.click()}
                >
                  <FileText className="size-4" />
                  {file ? file.name : "Seleccionar PDF..."}
                </Button>

                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={(event) =>
                    setFile(event.target.files?.[0] ?? null)
                  }
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Compromiso relacionado</Label>

              <Select
                items={itemOptions}
                value={itemId}
                onValueChange={(value) =>
                  setItemId((value as string) ?? WHOLE_PLAN)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent alignItemWithTrigger={false}>
                  {itemOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="evidence-description" className="text-xs">
                Descripción (opcional)
              </Label>

              <Textarea
                id="evidence-description"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Qué demuestra esta evidencia..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={reset}
              >
                Cancelar
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={handleSubmit}
                disabled={addEvidence.isPending}
              >
                {addEvidence.isPending && <Spinner />}
                Subir evidencia
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
