import { ExternalLink, FileText, Pencil } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import useUploadActa from "../hooks/useUploadActa";
import { uploadedFileUrl } from "../lib/fileUrl";
import { isClosed } from "../lib/planStatus";
import type { Plan } from "../types/Plan";

interface ActaSectionProps {
  plan: Plan;
  /** Directors attach/replace the acta; the teacher only reads it. */
  canEdit: boolean;
}

/** Acta de compromiso firmada con el docente: PDF + descripción. */
export function ActaSection({ plan, canEdit }: ActaSectionProps) {
  const uploadActa = useUploadActa();
  const inputRef = useRef<HTMLInputElement>(null);

  const [editing, setEditing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState(plan.acta_description ?? "");

  const editable = canEdit && !isClosed(plan.status);
  const pdfUrl = uploadedFileUrl(plan.acta_pdf_url);

  const handleSave = () => {
    if (!file && description === (plan.acta_description ?? "")) {
      setEditing(false);
      return;
    }

    uploadActa.mutate(
      { planId: plan.id, file, description },
      {
        onSuccess: () => {
          toast.success("Acta de compromiso guardada.");
          setEditing(false);
          setFile(null);
        },
        onError: (error: unknown) =>
          toast.error(
            error instanceof Error ? error.message : "Error al guardar el acta.",
          ),
      },
    );
  };

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Acta de compromiso
        </h4>

        {editable && !editing && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
          >
            <Pencil className="size-3.5" />
            {plan.has_acta ? "Editar acta" : "Adjuntar acta"}
          </Button>
        )}
      </div>

      {!editing && (
        <div className="rounded-lg border p-3">
          {plan.has_acta || plan.acta_description ? (
            <div className="space-y-2">
              {pdfUrl ? (
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:underline"
                >
                  <ExternalLink className="size-3.5" />
                  Ver acta firmada (PDF)
                </a>
              ) : (
                <p className="text-[12px] text-muted-foreground">
                  Sin PDF adjunto todavía.
                </p>
              )}

              {plan.acta_description && (
                <p className="text-[13px] leading-snug text-muted-foreground">
                  {plan.acta_description}
                </p>
              )}

              {plan.acta_uploaded_at && (
                <p className="text-[11.5px] text-muted-foreground">
                  Adjuntada el{" "}
                  {new Date(plan.acta_uploaded_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              {editable
                ? "Aún no se ha adjuntado el acta firmada con el docente."
                : "El director aún no adjunta el acta de compromiso."}
            </p>
          )}
        </div>
      )}

      {editing && (
        <div className="space-y-3 rounded-lg border p-3">
          <div className="space-y-1.5">
            <Label className="text-xs">PDF del acta firmada</Label>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => inputRef.current?.click()}
              >
                <FileText className="size-4" />
                {file
                  ? file.name
                  : plan.has_acta
                    ? "Reemplazar PDF..."
                    : "Seleccionar PDF..."}
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
            <Label htmlFor="acta-description" className="text-xs">
              Descripción del compromiso
            </Label>

            <Textarea
              id="acta-description"
              rows={2}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Acuerdos firmados en el acta..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setEditing(false);
                setFile(null);
                setDescription(plan.acta_description ?? "");
              }}
            >
              Cancelar
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={uploadActa.isPending}
            >
              {uploadActa.isPending && <Spinner />}
              Guardar acta
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
