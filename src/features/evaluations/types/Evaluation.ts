export interface EvaluationRecord {
  id: number;
  user_id: string;
  academic_period_id: number;
  department_id: number;
  pdf_url: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  count: number | null;
  academic_period_name?: string;
  active: boolean;
  overall_average: number | null;
}

export interface EvaluationStatusUpdate {
  active: boolean;
}

export interface EvaluationScore {
  id: number;
  evaluation_id: number;
  academic_group_id: number;
  group_name: string | null;
  respondent_count: number;
  overall_average: string;
}
