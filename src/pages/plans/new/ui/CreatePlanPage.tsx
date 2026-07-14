import { ArrowLeft, FileText, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { usePeriodsStore } from "@/features/periods";
import {
  describe,
  ItemEditor,
  nextKey,
  OVERALL,
  QUALITATIVE,
  targetKey,
  uploadActa,
  useCreatePlan,
  usePlanCandidates,
  usePlanIndicators,
  usePlanPeriods,
  WeaknessHints,
  WHOLE_DIMENSION,
  type DraftItem,
  type PlanCandidate,
  type TargetType,
} from "@/features/plans";
import { AppFooter, PageHeader } from "@/shared/ui";
import { AppLayout } from "@/widgets/layout";

const DEFAULT_THRESHOLD = 3.5;

export function CreatePlanPage() {
  const [, navigate] = useLocation();

  const selectedPeriod = usePeriodsStore((state) => state.selectedPeriod);

  const createPlan = useCreatePlan();

  // Grades for a period arrive at the start of the next one, so the current
  // academic period usually has none: the origin period is picked among the
  // ones the department already has an evaluation for.
  const { data: periodsData, isLoading: loadingPeriods } = usePlanPeriods();
  const periods = useMemo(() => periodsData?.data ?? [], [periodsData]);

  const [periodChoice, setPeriodChoice] = useState<string>("");

  const defaultPeriodId = useMemo(() => {
    if (periods.length === 0) return "";

    const globalId = selectedPeriod?.id ? String(selectedPeriod.id) : "";
    const globalHasGrades = periods.some((p) => String(p.id) === globalId);

    return globalHasGrades ? globalId : String(periods[0].id);
  }, [periods, selectedPeriod]);

  const periodId = periodChoice || defaultPeriodId;
  const originPeriodId = periodId ? Number(periodId) : undefined;

  const { data: candidatesData, isLoading: loadingTeachers } =
    usePlanCandidates(originPeriodId);
  const { data: indicatorsData } = usePlanIndicators();

  const candidates = useMemo(
    () => candidatesData?.data?.teachers ?? [],
    [candidatesData],
  );
  const threshold = candidatesData?.data?.threshold ?? DEFAULT_THRESHOLD;
  const catalog = indicatorsData?.data;

  const [teacherId, setTeacherId] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [initializedFor, setInitializedFor] = useState<string>("");

  const periodOptions = useMemo(
    () =>
      periods.map((period) => ({
        value: String(period.id),
        label: period.name ? `${period.code} · ${period.name}` : period.code,
      })),
    [periods],
  );

  /** Switching the origin period invalidates the teacher and their averages. */
  const changePeriod = (value: string) => {
    setPeriodChoice(value);
    setTeacherId("");
    setInitializedFor("");
    setItems([]);
    setTitle("");
  };

  // Acta de compromiso (optional at creation, uploaded right after the plan).
  const [actaFile, setActaFile] = useState<File | null>(null);
  const [actaDescription, setActaDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
        ...describe(item, isOverall ? catalog?.overall.suggestions[0] : undefined),
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!originPeriodId) {
      toast.error("Selecciona el periodo de origen del plan.");
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

    setSubmitting(true);
    try {
      const res = await createPlan.mutateAsync({
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
      });

      const planId = res.data?.id;

      if (planId && (actaFile || actaDescription.trim())) {
        try {
          await uploadActa({
            planId,
            file: actaFile,
            description: actaDescription.trim() || undefined,
          });
        } catch {
          // The plan exists: land on its detail where the acta can be retried.
          toast.error(
            "Plan creado, pero el acta no se pudo adjuntar. Reintenta desde el detalle.",
          );
          navigate(`/plans/${planId}`);
          return;
        }
      }

      toast.success("Plan de mejoramiento creado.");
      navigate(planId ? `/plans/${planId}` : "/plans");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Error al crear el plan.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <Link
        href="/plans"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Volver a planes
      </Link>

      <PageHeader
        title="Crear Plan de Seguimiento"
        description="Cada compromiso apunta a un indicador: el promedio general, la nota general de una dimensión, o un ítem específico del formulario."
      />

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Card className="space-y-4 p-5 sm:p-6">
          <h3 className="text-sm font-semibold">1 · Periodo y docente</h3>

          <div className="space-y-2">
            <Label>Periodo de origen (notas cargadas)</Label>

            <Select
              items={periodOptions}
              value={periodId}
              onValueChange={(value) => changePeriod((value as string) ?? "")}
            >
              <SelectTrigger className="w-full sm:max-w-md">
                <SelectValue
                  placeholder={
                    loadingPeriods
                      ? "Cargando periodos..."
                      : "Seleccione un periodo..."
                  }
                />
              </SelectTrigger>

              <SelectContent alignItemWithTrigger={false}>
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <p className="text-xs text-muted-foreground">
              El plan parte del periodo donde se detectó el bajo desempeño; su
              cumplimiento se verifica con las notas del periodo siguiente.
            </p>

            {!loadingPeriods && periods.length === 0 && (
              <p className="rounded-lg border border-dashed p-3 text-xs text-muted-foreground">
                Tu departamento aún no tiene evaluaciones cargadas. Sube el PDF
                de una evaluación para poder crear planes.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Docente</Label>

            <Select
              items={teacherOptions}
              value={teacherId}
              onValueChange={(value) => setTeacherId((value as string) ?? "")}
            >
              <SelectTrigger className="w-full sm:max-w-md">
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

            {!loadingTeachers && originPeriodId && candidates.length === 0 && (
              <p className="text-xs text-muted-foreground">
                No hay docentes evaluados en este periodo.
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
        </Card>

        <Card className="space-y-4 p-5 sm:p-6">
          <h3 className="text-sm font-semibold">2 · Información del plan</h3>

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
        </Card>

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">3 · Compromisos / ítems</h3>

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
        </Card>

        <Card className="space-y-4 p-5 sm:p-6">
          <div>
            <h3 className="text-sm font-semibold">
              4 · Acta de compromiso (opcional)
            </h3>

            <p className="mt-1 text-[12.5px] text-muted-foreground">
              Si ya firmaron el acta con el docente, adjunta el PDF. También
              puedes hacerlo después desde el detalle del plan.
            </p>
          </div>

          <div className="space-y-2">
            <Label>PDF del acta firmada</Label>

            <ActaFilePicker file={actaFile} onFile={setActaFile} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="acta-description">Descripción del acta</Label>

            <Textarea
              id="acta-description"
              rows={2}
              value={actaDescription}
              onChange={(event) => setActaDescription(event.target.value)}
              placeholder="Acuerdos firmados en el acta..."
            />
          </div>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/plans")}
          >
            Cancelar
          </Button>

          <Button type="submit" disabled={submitting}>
            {submitting && <Spinner />}
            {submitting ? "Creando plan..." : "Crear Plan"}
          </Button>
        </div>
      </form>

      <AppFooter>
        {selectedPeriod
          ? `Periodo ${selectedPeriod.code} · Sistema de Evaluación Docente`
          : "Sistema de Evaluación Docente"}
      </AppFooter>
    </AppLayout>
  );
}

function ActaFilePicker({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (file: File | null) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-[13px] font-medium hover:bg-muted">
        <FileText className="size-4" />
        {file ? file.name : "Seleccionar PDF..."}

        <input
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => onFile(event.target.files?.[0] ?? null)}
        />
      </label>

      {file && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => onFile(null)}
        >
          Quitar
        </Button>
      )}
    </div>
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
