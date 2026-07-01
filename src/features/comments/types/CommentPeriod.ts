export interface CommentPeriod {
  id: number;
  teacher_id: number | null;
  evaluation_id: number | null;
  academic_groups_id: number | null;
  original_text: string | null;
  risk_level: number | null;
  pedagogical_category_id: number | null;
  created_at: string;
  updated_at: string;
}
