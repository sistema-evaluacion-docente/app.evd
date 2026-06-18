export interface Setting {
  id: number;
  key: string;
  value: string;
  value_type: string;
  description: string | null;
  changed_by: string | null;
  effective_from: string;
  created_at: string;
  updated_at: string;
}

export interface SettingHistory {
  id: number;
  key: string;
  old_value: string | null;
  new_value: string;
  changed_by: string | null;
  change_reason: string | null;
  changed_at: string;
}
