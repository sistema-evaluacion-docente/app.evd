export interface EvaluationComment {
  teacher_id: number;
  evaluation_id: number;
  academic_groups_id: number;
  group_name: string | null;
  teacher_name: string | null;
  teacher_avatar_url: string | null;
  course_name: string | null;
  original_text: string;
}
