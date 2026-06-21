import type { User } from "@/features/auth";

export interface Profile extends User {
  department_name?: string;
  facultad?: string;
  vinculacion?: string;
  identification?: string;
  phone?: string;
  office?: string;
  joined_at?: string;
}
