import { Plus, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button, Input, Modal, Select } from "@/shared/ui";
import useCreatePlan from "../hooks/useCreatePlan";
import { TARGET_TYPE_LABEL } from "../lib/planStatus";
import type {
  AtRiskTeacher,
  PlanItemInput,
  TargetType,
} from "../types/Plan";

const DIMENSIONS = [
  "Desarrollo del Conocimiento",
  "Desempeño Docente",
  "Procesos de Evaluación",
  "Integración Interpersonal",
];

const TARGET_OPTIONS = Object.entries(TARGET_TYPE_LABEL).map(
  ([value, label]) => ({ value, label }),
);

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

function buildItemsFor(teacher: AtRiskTeacher | undefined): DraftItem[] {
  if (!teacher) return [];
  const items: DraftItem[] = [
    {
      key: nextKey(),
      description: "Elevar el promedio general por encima del umbral (3.5).",
      target_type: "OVERALL_AVERAGE",
      target_ref: null,
      baseline_value: teacher.overall_average,
      target_value: 3.5,
    },
  ];
  for (const dim of teacher.weak_dimensions) {
    items.push({
      key: nextKey(),
      description: dim.suggestions[0] ?? `Mejorar ${dim.dimension}`,
      target_type: "DIMENSION",
      target_ref: dim.dimension,
      baseline_value: dim.average,
      target_value: 3.5,
    });
  }
  return items;
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
    <Modal open={open} onClose={handleClose} widthClass="max-w-2xl">
      <div className="flex items-start justify-between gap-3 border-b border-ink-100 p-6">
        <div>
          <h3 className="text-[18px] font-semibold text-ink-900">
            Crear Plan de Seguimiento
          </h3>
          <p className="mt-1 text-[13px] text-ink-500">
            Los ítems se pre-cargan con las dimensiones donde el docente salió
            por debajo del umbral. Puedes quitarlos, editarlos o añadir nuevos.
          </p>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-ink-500 hover:bg-ink-100"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </div>

      <form
        className="max-h-[70vh] space-y-4 overflow-y-auto p-6"
        onSubmit={handleSubmit}
      >
        <Field label="Docente (bajo umbral)">
          <Select
            value={teacherId}
            onChange={setTeacherId}
            placeholder="Seleccione un docente..."
            options={atRiskTeachers.map((t) => ({
              value: String(t.teacher_id),
              label: `${t.name ?? "Docente"} — ${t.overall_average.toFixed(2)}`,
            }))}
          />
          {atRiskTeachers.length === 0 && (
            <p className="mt-1 text-[12px] text-ink-500">
              No hay docentes bajo umbral sin plan en el periodo seleccionado.
            </p>
          )}
        </Field>

        <Field label="Título del plan">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Plan de mejoramiento · Juan Pérez"
          />
        </Field>

        <Field label="Descripción (opcional)">
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Contexto del compromiso consensuado..."
            className="w-full rounded-md border border-ink-200 bg-card px-3 py-2 text-[13px] text-ink-900 transition-colors placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15"
          />
        </Field>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-600">
              Compromisos / ítems
            </label>
            <Button type="button" variant="soft" size="sm" onClick={addItem}>
              <Plus size={14} />
              Añadir ítem
            </Button>
          </div>

          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.key}
                className="rounded-lg border border-ink-200 p-3"
              >
                <div className="flex items-start gap-2">
                  <textarea
                    rows={2}
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.key, { description: e.target.value })
                    }
                    placeholder="Acción de mejora concreta..."
                    className="min-w-0 flex-1 rounded-md border border-ink-200 bg-card px-3 py-2 text-[13px] text-ink-900 placeholder:text-ink-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/15"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.key)}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-500 hover:bg-brand-50 hover:text-brand-700"
                    aria-label="Quitar ítem"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <div>
                    <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                      Indicador
                    </span>
                    <Select
                      value={item.target_type}
                      onChange={(value) =>
                        updateItem(item.key, {
                          target_type: value as TargetType,
                          target_ref:
                            value === "DIMENSION" ? DIMENSIONS[0] : null,
                        })
                      }
                      options={TARGET_OPTIONS}
                    />
                  </div>

                  {item.target_type === "DIMENSION" && (
                    <div>
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                        Dimensión
                      </span>
                      <Select
                        value={item.target_ref ?? DIMENSIONS[0]}
                        onChange={(value) =>
                          updateItem(item.key, { target_ref: value })
                        }
                        options={DIMENSIONS}
                      />
                    </div>
                  )}

                  {item.target_type !== "QUALITATIVE" && (
                    <div>
                      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                        Meta (≥)
                      </span>
                      <Input
                        type="number"
                        step="0.1"
                        min="1"
                        max="5"
                        value={item.target_value ?? ""}
                        onChange={(e) =>
                          updateItem(item.key, {
                            target_value:
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
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
              <p className="rounded-lg border border-dashed border-ink-200 p-4 text-center text-[12.5px] text-ink-500">
                Selecciona un docente para pre-cargar los compromisos, o añade
                uno manualmente.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-ink-100 pt-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button type="submit" variant="brand" disabled={createPlan.isPending}>
            {createPlan.isPending ? "Creando..." : "Crear Plan"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-600">
        {label}
      </label>
      {children}
    </div>
  );
}
