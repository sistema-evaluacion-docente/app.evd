export type TargetType =
  | "DIMENSION"
  | "PEDAGOGICAL_CATEGORY"
  | "OVERALL_AVERAGE"
  | "QUALITATIVE";

export type PlanStatus =
  | "BORRADOR"
  | "EN_SEGUIMIENTO"
  | "RESULTADO_DISPONIBLE"
  | "CERRADO_CUMPLIDO"
  | "CERRADO_NO_CUMPLIDO"
  | "CERRADO_MANUAL";

export type ItemStatus =
  | "PENDIENTE"
  | "EN_PROGRESO"
  | "CUMPLIDO"
  | "NO_CUMPLIDO";

export type CloseResult = "CUMPLIDO" | "NO_CUMPLIDO" | "MANUAL";

export interface PlanItem {
  id: number;
  plan_id: number;
  description: string;
  target_type: TargetType;
  target_ref: string | null;
  baseline_value: number | null;
  target_value: number | null;
  result_value: number | null;
  status: ItemStatus;
  order: number;
}

export interface PlanCheckpoint {
  id: number;
  plan_id: number;
  stage: string;
  scheduled_date: string | null;
  completed_at: string | null;
  status: string;
  notes: string | null;
}

export interface Plan {
  id: number;
  teacher_id: number;
  teacher_name: string | null;
  teacher_avatar_url: string | null;
  department_id: number | null;
  origin_period_id: number;
  origin_period_code: string | null;
  verification_period_id: number | null;
  verification_period_code: string | null;
  title: string;
  description: string | null;
  status: PlanStatus;
  close_reason: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: number | null;
  closed_at: string | null;
  progress: number;
  suggested_result: string | null;
  items: PlanItem[];
  checkpoints: PlanCheckpoint[];
  created_at: string | null;
  updated_at: string | null;
}

export interface PlanItemInput {
  id?: number;
  description: string;
  target_type: TargetType;
  target_ref?: string | null;
  baseline_value?: number | null;
  target_value?: number | null;
  status?: ItemStatus;
}

export interface CreatePlanInput {
  teacher_id: number;
  origin_period_id: number;
  verification_period_id?: number | null;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  items: PlanItemInput[];
}

export interface UpdatePlanInput {
  title?: string;
  description?: string;
  verification_period_id?: number | null;
  start_date?: string;
  end_date?: string;
  items?: PlanItemInput[];
}

export interface ClosePlanInput {
  result: CloseResult;
  reason?: string;
}

export interface WeakDimension {
  dimension: string;
  average: number;
  suggestions: string[];
}

export interface AtRiskTeacher {
  teacher_id: number;
  name: string | null;
  avatar_url: string | null;
  institutional_code: string | null;
  overall_average: number;
  weak_dimensions: WeakDimension[];
  overall_suggestions: string[];
}
