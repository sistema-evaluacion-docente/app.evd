import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
import useCreatePlan from "../hooks/useCreatePlan";
import { TARGET_TYPE_LABEL } from "../lib/planStatus";
import type { AtRiskTeacher, PlanItemInput, TargetType } from "../types/Plan";

const DIMENSIONS = [
  "Desarrollo del Conocimiento",
  "Desempeño Docente",
  "Procesos de Evaluación",
  "Integración Interpersonal",
];

const TARGET_OPTIONS = Object.entries(TARGET_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

const DIMENSION_OPTIONS = DIMENSIONS.map((value) => ({ value, label: value }));

interface DraftItem extends PlanItemInput {
  key: string;
}

interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
  originPeriodId?: number;
  atRiskTeachers: AtRiskTeacher[];
  preselectedTeacherId?: number;
}

let keySeq = 0;
const nextKey = () => `item-${keySeq++}`;

/**
 * Seeds the form with a single baseline commitment (raise the overall average).
 * The teacher's weak dimensions are not expanded into one item each — that
 * produced a wall of pre-filled rows; they're added on demand instead.
 */
function buildItemsFor(teacher: AtRiskTeacher | undefined): DraftItem[] {
  if (!teacher) return [];
  return [
    {
      key: nextKey(),
      description: "Elevar el promedio general por encima del umbral (3.5).",
      target_type: "OVERALL_AVERAGE",
      target_ref: null,
      baseline_value: teacher.overall_average,
      target_value: 3.5,
    },
  ];
}

export function CreatePlanModal({
  open,
  onClose,
  originPeriodId,
  atRiskTeachers,
  preselectedTeacherId,
}: CreatePlanModalProps) {
  const createPlan = useCreatePlan();

  const [teacherId, setTeacherId] = useState<string>(
    preselectedTeacherId ? String(preselectedTeacherId) : "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [initializedFor, setInitializedFor] = useState<string>("");

  const selectedTeacher = useMemo(
    () => atRiskTeachers.find((t) => String(t.teacher_id) === teacherId),
    [atRiskTeachers, teacherId],
  );

  // `items` is what lets the trigger render the label instead of the raw value.
  const teacherOptions = useMemo(
    () =>
      atRiskTeachers.map((teacher) => ({
        value: String(teacher.teacher_id),
        label: `${teacher.name ?? "Docente"} — ${teacher.overall_average.toFixed(2)}`,
      })),
    [atRiskTeachers],
  );

  // Prefill items/title when the selected teacher changes.
  if (teacherId && teacherId !== initializedFor) {
    setInitializedFor(teacherId);
    setItems(buildItemsFor(selectedTeacher));
    setTitle(
      selectedTeacher
        ? `Plan de mejoramiento · ${selectedTeacher.name ?? "Docente"}`
        : "",
    );
  }

  const updateItem = (key: string, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.key === key ? { ...it, ...patch } : it)),
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        description: "",
        target_type: "QUALITATIVE",
        target_ref: null,
        target_value: null,
      },
    ]);
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((it) => it.key !== key));
  };

  const reset = () => {
    setTeacherId(preselectedTeacherId ? String(preselectedTeacherId) : "");
    setTitle("");
    setDescription("");
    setItems([]);
    setInitializedFor("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!originPeriodId) {
      toast.error("Selecciona un periodo académico primero.");
      return;
    }
    if (!teacherId) {
      toast.error("Selecciona un docente.");
      return;
    }
    if (!title.trim()) {
      toast.error("El plan necesita un título.");
      return;
    }
    if (items.length === 0 || items.some((it) => !it.description.trim())) {
      toast.error("Cada ítem necesita una descripción.");
      return;
    }

    createPlan.mutate(
      {
        teacher_id: Number(teacherId),
        origin_period_id: originPeriodId,
        title: title.trim(),
        description: description.trim() || undefined,
        items: items.map((it) => ({
          description: it.description,
          target_type: it.target_type,
          target_ref:
            it.target_type === "DIMENSION" ||
            it.target_type === "PEDAGOGICAL_CATEGORY"
              ? it.target_ref
              : null,
          baseline_value: it.baseline_value,
          target_value: it.target_value,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Plan de mejoramiento creado.");
          handleClose();
        },
        onError: (error: unknown) => {
          const message =
            error instanceof Error ? error.message : "Error al crear el plan.";
          toast.error(message);
        },
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Plan de Seguimiento</DialogTitle>
          <DialogDescription>
            Al elegir docente se pre-carga un compromiso base sobre su promedio
            general. Puedes editarlo, quitarlo o añadir los que necesites.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Docente (bajo umbral)</Label>

              <Select
                items={teacherOptions}
                value={teacherId}
                onValueChange={(value) => setTeacherId((value as string) ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccione un docente..." />
                </SelectTrigger>

                <SelectContent alignItemWithTrigger={false}>
                  {teacherOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {atRiskTeachers.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay docentes bajo umbral sin plan en el periodo
                  seleccionado.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-title">Título del plan</Label>

              <Input
                id="plan-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ej. Plan de mejoramiento · Juan Pérez"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan-description">Descripción (opcional)</Label>

              <Textarea
                id="plan-description"
                rows={2}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Contexto del compromiso consensuado..."
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Compromisos / ítems</Label>

                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={addItem}
                >
                  <Plus className="size-4" />
                  Añadir ítem
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.key} className="rounded-lg border p-3">
                    <div className="flex items-start gap-2">
                      <Textarea
                        rows={2}
                        value={item.description}
                        onChange={(event) =>
                          updateItem(item.key, {
                            description: event.target.value,
                          })
                        }
                        placeholder="Acción de mejora concreta..."
                        className="min-w-0 flex-1"
                      />

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeItem(item.key)}
                        aria-label="Quitar ítem"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Indicador</Label>

                        <Select
                          items={TARGET_OPTIONS}
                          value={item.target_type}
                          onValueChange={(value) =>
                            updateItem(item.key, {
                              target_type: value as TargetType,
                              target_ref:
                                value === "DIMENSION" ? DIMENSIONS[0] : null,
                            })
                          }
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>

                          <SelectContent alignItemWithTrigger={false}>
                            {TARGET_OPTIONS.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {item.target_type === "DIMENSION" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Dimensión</Label>

                          <Select
                            items={DIMENSION_OPTIONS}
                            value={item.target_ref ?? DIMENSIONS[0]}
                            onValueChange={(value) =>
                              updateItem(item.key, {
                                target_ref: value as string,
                              })
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue/>
                            </SelectTrigger>

                            <SelectContent alignItemWithTrigger={false} className="w-auto">
                              {DIMENSION_OPTIONS.map((option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      {item.target_type !== "QUALITATIVE" && (
                        <div className="space-y-1.5">
                          <Label className="text-xs">Meta (≥)</Label>

                          <Input
                            type="number"
                            step="0.1"
                            min="1"
                            max="5"
                            value={item.target_value ?? ""}
                            onChange={(event) =>
                              updateItem(item.key, {
                                target_value:
                                  event.target.value === ""
                                    ? null
                                    : Number(event.target.value),
                              })
                            }
                            placeholder="3.5"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Selecciona un docente para pre-cargar los compromisos, o
                    añade uno manualmente.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>

            <Button type="submit" disabled={createPlan.isPending}>
              {createPlan.isPending && <Spinner />}
              {createPlan.isPending ? "Creando plan..." : "Crear Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
