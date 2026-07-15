export interface RiskLevel {
  id: number;
  name: string;
  color_hex: string;
}

export interface PedagogicalCategory {
  id: number;
  name: string;
  color_hex: string;
}

export interface CommentItem {
  id: number;
  original_text: string;
  risk_level: RiskLevel | null;
  risk_score: number | null;
  pedagogical_category: PedagogicalCategory | null;
  category_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationComment {
  teacher_id: number;
  evaluation_id: number;
  academic_groups_id: number;
  group_name: string | null;
  teacher_name: string | null;
  teacher_avatar_url: string | null;
  course_name: string | null;
  original_text: string;
  risk_level: RiskLevel | null;
  risk_score: number | null;
  pedagogical_category: PedagogicalCategory | null;
  category_score: number | null;
}
