export interface QuestionItem {
  code: string;
  text: string;
  dimension: string;
}

export interface QuestionScore {
  evaluation_score_id: number;
  question_code: string;
  score: string;
}

export interface QuestionDetail {
  id: number;
  code: string;
  text: string;
  score: number;
}
