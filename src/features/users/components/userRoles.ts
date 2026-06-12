export const ALLOWED_USER_ROLES = [
  "DOCENTE",
  "DIRECTOR DE DEPARTAMENTO",
] as const;

export type AllowedUserRole = (typeof ALLOWED_USER_ROLES)[number];
