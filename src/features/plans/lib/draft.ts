import type { PlanItemInput, TargetType } from "../types/Plan";

/** Sentinel for "the dimension as a whole" inside the item select. */
export const WHOLE_DIMENSION = "__DIMENSION__";

/** Values of the first select that are not a dimension. */
export const OVERALL = "OVERALL_AVERAGE";
export const QUALITATIVE = "QUALITATIVE";

export const DEFAULT_THRESHOLD = 3.5;

/** Below this the indicator is critical and the chip turns red. */
export const CRITICAL_SCORE = 3;

/** Identity of the indicator an item points at, used to block duplicates. */
export const targetKey = (targetType: TargetType, targetRef: string | null) =>
  `${targetType}:${targetRef ?? ""}`;

export interface DraftItem extends PlanItemInput {
  key: string;
  /** Dimension the item belongs to; null for the overall average / qualitative. */
  dimension: string | null;
  /** The description was written by us and can still be replaced on re-selection. */
  auto: boolean;
}

let keySeq = 0;
export const nextKey = () => `item-${keySeq++}`;

export const format = (value: number | null | undefined) =>
  value == null ? "—" : value.toFixed(2);

/** Keep an auto-written description in sync with the indicator; never clobber the director's own text. */
export function describe(item: DraftItem, suggestion: string | undefined) {
  const replaceable = item.auto || !item.description.trim();
  if (!replaceable || !suggestion) return {};

  return { description: suggestion, auto: true };
}
