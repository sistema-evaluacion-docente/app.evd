import type { PlanStatus } from "../types/Plan";

export interface StatusMeta {
  label: string;
  bar: string;
  text: string;
  bg: string;
  border: string;
}

// No `dark:` variants on purpose: the ramp flip in index.css already darkens the
// 50/200 tints and lightens the 700 text step, and the saturated 500/600 bars
// read correctly on either theme.
export const PLAN_STATUS_META: Record<PlanStatus, StatusMeta> = {
  BORRADOR: {
    label: "Borrador",
    bar: "bg-ink-400",
    text: "text-ink-600",
    bg: "bg-ink-50",
    border: "border-ink-200/70",
  },
  EN_SEGUIMIENTO: {
    label: "En Seguimiento",
    bar: "bg-sky-500",
    text: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-200/70",
  },
  RESULTADO_DISPONIBLE: {
    label: "Resultado Disponible",
    bar: "bg-amber-500",
    text: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200/70",
  },
  CERRADO_CUMPLIDO: {
    label: "Cerrado · Cumplió",
    bar: "bg-emerald-500",
    text: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200/70",
  },
  CERRADO_NO_CUMPLIDO: {
    label: "Cerrado · No cumplió",
    bar: "bg-brand-600",
    text: "text-brand-700",
    bg: "bg-brand-50",
    border: "border-brand-200/70",
  },
  CERRADO_MANUAL: {
    label: "Cerrado · Manual",
    bar: "bg-violet-500",
    text: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200/70",
  },
};

/** Value sent when no status filter is applied; `getPlans` drops it from the query. */
export const PLAN_STATUS_FILTER_ALL = "Todos";

export const PLAN_STATUS_FILTERS: { value: string; label: string }[] = [
  { value: PLAN_STATUS_FILTER_ALL, label: "Todos" },
  { value: "CERRADO_CUMPLIDO", label: "Cumplidos" },
  { value: "CERRADO_NO_CUMPLIDO", label: "No cumplidos" },
];

export const TARGET_TYPE_LABEL: Record<string, string> = {
  DIMENSION: "Dimensión",
  QUESTION: "Ítem",
  PEDAGOGICAL_CATEGORY: "Categoría",
  OVERALL_AVERAGE: "Promedio general",
  QUALITATIVE: "Cualitativo",
};

export function statusMeta(status: PlanStatus): StatusMeta {
  return PLAN_STATUS_META[status] ?? PLAN_STATUS_META.EN_SEGUIMIENTO;
}

export function isClosed(status: PlanStatus): boolean {
  return status.startsWith("CERRADO_");
}
