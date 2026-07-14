import { Check, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
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
import { cn } from "@/shared/lib/utils";
import useCreatePlan from "../hooks/useCreatePlan";
import usePlanCandidates from "../hooks/usePlanCandidates";
import usePlanIndicators from "../hooks/usePlanIndicators";
import type {
  PlanCandidate,
  PlanIndicators,
  PlanItemInput,
  TargetType,
} from "../types/Plan";

type CatalogDimension = PlanIndicators["dimensions"][number];

/** Sentinel for "the dimension as a whole" inside the item select. */
const WHOLE_DIMENSION = "__DIMENSION__";

/** Values of the first select that are not a dimension. */
const OVERALL = "OVERALL_AVERAGE";
const QUALITATIVE = "QUALITATIVE";

const DEFAULT_THRESHOLD = 3.5;

/** Below this the indicator is critical and the chip turns red. */
const CRITICAL_SCORE = 3;

/** Identity of the indicator an item points at, used to block duplicates. */
const targetKey = (targetType: TargetType, targetRef: string | null) =>
  `${targetType}:${targetRef ?? ""}`;

interface DraftItem extends PlanItemInput {
  key: string;
  /** Dimension the item belongs to; null for the overall average / qualitative. */
  dimension: string | null;
  /** The description was written by us and can still be replaced on re-selection. */
  auto: boolean;
}

interface CreatePlanModalProps {
  open: boolean;
  onClose: () => void;
  originPeriodId?: number;
  preselectedTeacherId?: number;
}

let keySeq = 0;
const nextKey = () => `item-${keySeq++}`;

const format = (value: number | null | undefined) =>
  value == null ? "—" : value.toFixed(2);

export function CreatePlanModal({
  open,
  onClose,
  originPeriodId,
  preselectedTeacherId,
}: CreatePlanModalProps) {
  const createPlan = useCreatePlan();

  // Only fetch while the modal is open: the payload carries every teacher of the
  // department with all their dimension and item averages.
  const { data: candidatesData, isLoading: loadingTeachers } = usePlanCandidates(
    originPeriodId,
    open,
  );
  const { data: indicatorsData } = usePlanIndicators();

  const candidates = useMemo(
    () => candidatesData?.data?.teachers ?? [],
    [candidatesData],
  );
  const threshold = candidatesData?.data?.threshold ?? DEFAULT_THRESHOLD;
  const catalog = indicatorsData?.data;

  const [teacherId, setTeacherId] = useState<string>(
    preselectedTeacherId ? String(preselectedTeacherId) : "",
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [initializedFor, setInitializedFor] = useState<string>("");

  const teacher = useMemo(
    () => candidates.find((t) => String(t.teacher_id) === teacherId),
    [candidates, teacherId],
  );

  /** Current score of any indicator for the selected teacher. */
  const averageOf = (dimension: string | null, code?: string | null) => {
    if (!teacher) return null;
    if (!dimension) return teacher.overall_average;

    const dim = teacher.dimensions.find((d) => d.dimension === dimension);
    if (!dim) return null;
    if (!code) return dim.average;

    return dim.questions.find((q) => q.code === code)?.average ?? null;
  };

  /** Indicators already committed to: their hint chip is shown as taken. */
  const takenTargets = useMemo(
    () =>
      new Set(
        items
          .filter(
            (item) =>
              item.target_type === "DIMENSION" ||
              item.target_type === "QUESTION",
          )
          .map((item) => targetKey(item.target_type, item.target_ref ?? null)),
      ),
    [items],
  );

  /** What the teacher scores today on whatever indicator the item points at. */
  const currentValueOf = (item: DraftItem) => {
    if (item.target_type === "OVERALL_AVERAGE") return averageOf(null);
    if (item.target_type === "DIMENSION") return averageOf(item.dimension);
    if (item.target_type === "QUESTION")
      return averageOf(item.dimension, item.target_ref);
    return null;
  };

  // The whole department is listed: a teacher can be fine on average and still
  // be under the threshold on a single item.
  const teacherOptions = useMemo(
    () =>
      candidates.map((candidate) => ({
        value: String(candidate.teacher_id),
        label: teacherLabel(candidate),
      })),
    [candidates],
  );

  const dimensionOptions = useMemo(
    () => [
      { value: OVERALL, label: "Promedio general del docente" },
      ...(catalog?.dimensions ?? []).map((dim) => ({
        value: dim.dimension,
        label: dim.dimension,
      })),
      { value: QUALITATIVE, label: "Cualitativo (sin medición)" },
    ],
    [catalog],
  );

  // Prefill title (and a baseline commitment when the teacher is under the
  // threshold) as soon as a teacher is picked.
  if (teacherId && teacherId !== initializedFor) {
    setInitializedFor(teacherId);
    setTitle(
      teacher ? `Plan de mejoramiento · ${teacher.name ?? "Docente"}` : "",
    );
    setItems(
      teacher?.below_threshold
        ? [
            {
              key: nextKey(),
              description: `Elevar el promedio general por encima del umbral (${threshold}).`,
              target_type: "OVERALL_AVERAGE",
              target_ref: null,
              dimension: null,
              baseline_value: teacher.overall_average,
              target_value: threshold,
              auto: true,
            },
          ]
        : [],
    );
  }

  const updateItem = (key: string, patch: Partial<DraftItem>) =>
    setItems((prev) =>
      prev.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );

  const addItem = (patch: Partial<DraftItem> = {}) =>
    setItems((prev) => [
      ...prev,
      {
        key: nextKey(),
        description: "",
        target_type: "QUALITATIVE",
        target_ref: null,
        dimension: null,
        baseline_value: null,
        target_value: null,
        auto: false,
        ...patch,
      },
    ]);

  /** Add a commitment already pointing at one of the teacher's weak indicators. */
  const addWeakIndicator = (
    dimension: string,
    code: string | null,
    text: string,
    average: number | null,
    suggestion: string | undefined,
  ) =>
    addItem({
      description: suggestion ?? text,
      target_type: code ? "QUESTION" : "DIMENSION",
      target_ref: code ?? dimension,
      dimension,
      baseline_value: average,
      target_value: threshold,
      auto: true,
    });

  const removeItem = (key: string) =>
    setItems((prev) => prev.filter((item) => item.key !== key));

  /** First select: overall average, one of the dimensions, or qualitative. */
  const selectIndicator = (item: DraftItem, value: string) => {
    if (value === OVERALL || value === QUALITATIVE) {
      const isOverall = value === OVERALL;
      updateItem(item.key, {
        target_type: value as TargetType,
        target_ref: null,
        dimension: null,
        baseline_value: isOverall ? averageOf(null) : null,
        target_value: isOverall ? threshold : null,
        ...describe(
          item,
          isOverall
            ? catalog?.overall.suggestions[0]
            : undefined,
        ),
      });
      return;
    }

    const dimension = catalog?.dimensions.find((d) => d.dimension === value);
    updateItem(item.key, {
      target_type: "DIMENSION",
      target_ref: value,
      dimension: value,
      baseline_value: averageOf(value),
      target_value: threshold,
      ...describe(item, dimension?.suggestions[0]),
    });
  };

  /** Second select: the dimension as a whole, or one specific item of the form. */
  const selectQuestion = (item: DraftItem, value: string) => {
    const dimension = item.dimension;
    if (!dimension) return;

    if (value === WHOLE_DIMENSION) {
      const dim = catalog?.dimensions.find((d) => d.dimension === dimension);
      updateItem(item.key, {
        target_type: "DIMENSION",
        target_ref: dimension,
        baseline_value: averageOf(dimension),
        target_value: threshold,
        ...describe(item, dim?.suggestions[0]),
      });
      return;
    }

    const question = catalog?.dimensions
      .find((d) => d.dimension === dimension)
      ?.questions.find((q) => q.code === value);

    updateItem(item.key, {
      target_type: "QUESTION",
      target_ref: value,
      baseline_value: averageOf(dimension, value),
      target_value: threshold,
      ...describe(item, question?.suggestions[0]),
    });
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
        items: items.map((item) => ({
          description: item.description,
          target_type: item.target_type,
          target_ref:
            item.target_type === "QUALITATIVE" ||
            item.target_type === "OVERALL_AVERAGE"
              ? null
              : item.target_ref,
          baseline_value: item.baseline_value,
          target_value: item.target_value,
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
            Cada compromiso apunta a un indicador: el promedio general, la nota
            general de una dimensión, o un ítem específico del formulario.
          </DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Docente</Label>

              <Select
                items={teacherOptions}
                value={teacherId}
                onValueChange={(value) => setTeacherId((value as string) ?? "")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      loadingTeachers
                        ? "Cargando docentes..."
                        : "Seleccione un docente..."
                    }
                  />
                </SelectTrigger>

                <SelectContent alignItemWithTrigger={false}>
                  {candidates.map((candidate) => (
                    <SelectItem
                      key={candidate.teacher_id}
                      value={String(candidate.teacher_id)}
                    >
                      <span className="flex items-center gap-2">
                        <span>{candidate.name ?? "Docente"}</span>

                        <span className="num text-muted-foreground">
                          {candidate.overall_average.toFixed(2)}
                        </span>

                        {isRecommended(candidate) && (
                          <Badge className="border border-sky-200/70 bg-sky-50 text-sky-700">
                            Recomendado
                          </Badge>
                        )}

                        {candidate.has_plan && (
                          <Badge className="bg-muted text-muted-foreground">
                            Ya tiene plan
                          </Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {!loadingTeachers && candidates.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No hay docentes evaluados en el periodo seleccionado.
                </p>
              )}
            </div>

            {teacher && (
              <WeaknessHints
                teacher={teacher}
                threshold={threshold}
                taken={takenTargets}
                onAdd={addWeakIndicator}
              />
            )}

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
                  onClick={() => addItem()}
                >
                  <Plus className="size-4" />
                  Añadir ítem
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item) => (
                  <ItemEditor
                    key={item.key}
                    item={item}
                    catalog={catalog}
                    dimensionOptions={dimensionOptions}
                    currentValue={currentValueOf(item)}
                    onChange={updateItem}
                    onSelectIndicator={selectIndicator}
                    onSelectQuestion={selectQuestion}
                    onRemove={removeItem}
                  />
                ))}

                {items.length === 0 && (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Añade un compromiso y elige el indicador que debe mejorar.
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

/** Label rendered in the closed trigger; the dropdown row adds the badges. */
function teacherLabel(candidate: PlanCandidate) {
  return `${candidate.name ?? "Docente"} — ${candidate.overall_average.toFixed(2)}`;
}

/**
 * Worth a plan: the teacher is under the threshold overall, or is failing at
 * least one dimension or item — and doesn't already have a plan this period.
 */
function isRecommended(candidate: PlanCandidate) {
  if (candidate.has_plan) return false;

  return (
    candidate.below_threshold ||
    candidate.weak_dimensions.length > 0 ||
    candidate.weak_questions.length > 0
  );
}

/** Keep an auto-written description in sync with the indicator; never clobber the director's own text. */
function describe(item: DraftItem, suggestion: string | undefined) {
  const replaceable = item.auto || !item.description.trim();
  if (!replaceable || !suggestion) return {};

  return { description: suggestion, auto: true };
}

interface WeaknessHintsProps {
  teacher: PlanCandidate;
  threshold: number;
  /** Indicators already committed to, as `DIMENSION:<name>` / `QUESTION:<code>`. */
  taken: Set<string>;
  onAdd: (
    dimension: string,
    code: string | null,
    text: string,
    average: number | null,
    suggestion: string | undefined,
  ) => void;
}

/** One-click commitments for what this teacher is actually failing. */
function WeaknessHints({
  teacher,
  threshold,
  taken,
  onAdd,
}: WeaknessHintsProps) {
  const { weak_dimensions: dimensions, weak_questions: questions } = teacher;

  if (dimensions.length === 0 && questions.length === 0) {
    return (
      <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
        {teacher.name} no está por debajo de {threshold} en ninguna dimensión ni
        ítem. Puedes crear el plan igualmente eligiendo el indicador a mejorar.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/40 p-3">
      <p className="text-xs font-semibold text-foreground">
        Debilidades detectadas (por debajo de {threshold})
      </p>

      {dimensions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Categorías generales
          </p>

          <div className="flex flex-wrap gap-1.5">
            {dimensions.map((dim) => (
              <HintChip
                key={dim.dimension}
                label={`${dim.dimension} · ${format(dim.average)}`}
                average={dim.average}
                isDimension
                taken={taken.has(targetKey("DIMENSION", dim.dimension))}
                onClick={() =>
                  onAdd(
                    dim.dimension,
                    null,
                    `Mejorar la dimensión ${dim.dimension}.`,
                    dim.average,
                    dim.suggestions[0],
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {questions.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Ítems específicos
          </p>

          <div className="flex flex-wrap gap-1.5">
            {questions.map((question) => (
              <HintChip
                key={question.code}
                label={`${question.code} · ${question.text} · ${format(question.average)}`}
                average={question.average}
                taken={taken.has(targetKey("QUESTION", question.code))}
                onClick={() =>
                  onAdd(
                    question.dimension,
                    question.code,
                    question.text,
                    question.average,
                    question.suggestions[0],
                  )
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Red flags a critical score (< 3) wherever it appears; the rest is tinted by
 * what it is — blue for a whole category, amber for a single item.
 */
function chipTone(average: number | null, isDimension: boolean, taken: boolean) {
  if (taken) {
    return "cursor-not-allowed border-border bg-muted text-muted-foreground";
  }

  if (average != null && average < CRITICAL_SCORE) {
    return "cursor-pointer border-brand-200/70 bg-brand-50 text-brand-700 hover:bg-brand-100";
  }

  if (isDimension) {
    return "cursor-pointer border-sky-200/70 bg-sky-50 text-sky-700 hover:bg-sky-100";
  }

  return "cursor-pointer border-amber-200/70 bg-amber-50 text-amber-700 hover:bg-amber-100";
}

function HintChip({
  label,
  average,
  isDimension = false,
  taken,
  onClick,
}: {
  label: string;
  average: number | null;
  isDimension?: boolean;
  taken: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={taken}
      aria-pressed={taken}
      title={taken ? "Ya está en los compromisos del plan" : undefined}
      className={cn(
        "flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11.5px] transition-colors",
        chipTone(average, isDimension, taken),
      )}
    >
      {taken ? <Check className="size-3" /> : <Plus className="size-3" />}
      <span className="max-w-[22rem] truncate">{label}</span>
    </button>
  );
}

interface ItemEditorProps {
  item: DraftItem;
  catalog: PlanIndicators | undefined;
  dimensionOptions: { value: string; label: string }[];
  currentValue: number | null;
  onChange: (key: string, patch: Partial<DraftItem>) => void;
  onSelectIndicator: (item: DraftItem, value: string) => void;
  onSelectQuestion: (item: DraftItem, value: string) => void;
  onRemove: (key: string) => void;
}

function ItemEditor({
  item,
  catalog,
  dimensionOptions,
  currentValue,
  onChange,
  onSelectIndicator,
  onSelectQuestion,
  onRemove,
}: ItemEditorProps) {
  const dimension: CatalogDimension | undefined = catalog?.dimensions.find(
    (d) => d.dimension === item.dimension,
  );

  // "Nota general" first, then every item of the form inside the dimension.
  const questionOptions = useMemo(
    () => [
      { value: WHOLE_DIMENSION, label: "Nota general de la dimensión" },
      ...(dimension?.questions ?? []).map((question) => ({
        value: question.code,
        label: `${question.code} · ${question.text}`,
      })),
    ],
    [dimension],
  );

  const indicatorValue =
    item.target_type === "OVERALL_AVERAGE" || item.target_type === "QUALITATIVE"
      ? item.target_type
      : (item.dimension ?? "");

  const questionValue =
    item.target_type === "QUESTION" ? (item.target_ref ?? "") : WHOLE_DIMENSION;

  const measurable = item.target_type !== "QUALITATIVE";

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-start gap-2">
        <Textarea
          rows={2}
          value={item.description}
          onChange={(event) =>
            onChange(item.key, { description: event.target.value, auto: false })
          }
          placeholder="Acción de mejora concreta..."
          className="min-w-0 flex-1"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => onRemove(item.key)}
          aria-label="Quitar ítem"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-xs">Indicador</Label>

          <Select
            items={dimensionOptions}
            value={indicatorValue}
            onValueChange={(value) =>
              onSelectIndicator(item, (value as string) ?? QUALITATIVE)
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Elige el indicador..." />
            </SelectTrigger>

            <SelectContent alignItemWithTrigger={false}>
              {dimensionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {item.dimension && (
          <div className="space-y-1.5">
            <Label className="text-xs">Ítem de la dimensión</Label>

            <Select
              items={questionOptions}
              value={questionValue}
              onValueChange={(value) =>
                onSelectQuestion(item, (value as string) ?? WHOLE_DIMENSION)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent alignItemWithTrigger={false} className="w-auto">
                {questionOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {measurable && (
          <div className="space-y-1.5">
            <Label className="text-xs">Meta (≥)</Label>

            <Input
              type="number"
              step="0.1"
              min="1"
              max="5"
              value={item.target_value ?? ""}
              onChange={(event) =>
                onChange(item.key, {
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

        {measurable && (
          <div className="space-y-1.5">
            <Label className="text-xs">Nota actual</Label>

            <p className="num flex h-9 items-center text-[13px] font-semibold text-foreground">
              {format(currentValue)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
