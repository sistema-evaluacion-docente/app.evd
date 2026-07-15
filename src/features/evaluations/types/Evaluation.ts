export type AiStatus = "PENDING" | "ANALYZING" | "ANALYZED" | "FAILED";

export interface EvaluationRecord {
  id: number;
  user_id: string;
  academic_period_id: number;
  department_id: number;
  pdf_url: string;
  status: "PROCESSING" | "COMPLETED" | "FAILED";
  ai_status: AiStatus | null;
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
  course_name: string | null;
  course_code: string | null;
  respondent_count: number;
  overall_average: string;
}
