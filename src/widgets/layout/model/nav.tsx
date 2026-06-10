import {
  BarChart3,
  Calendar,
  FileText,
  LayoutGrid,
  TrendingUp,
  UserSearch,
  Users,
  type LucideIcon,
} from "lucide-react";

export type AppRole = "admin" | "director" | "teacher";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const DIRECTOR_NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { id: "teachers", label: "Docentes", icon: Users, href: "/teachers" },
  {
    id: "matrix",
    label: "Matriz Evaluación",
    icon: BarChart3,
    href: "/matrix",
  },
  {
    id: "plans",
    label: "Planes de Mejoramiento",
    icon: TrendingUp,
    href: "/plans",
  },
  { id: "docs", label: "Documentos", icon: FileText, href: "#" },
];

const ADMIN_NAV: NavItem[] = [
  {
    id: "directors",
    label: "Subir directores",
    icon: UserSearch,
    href: "/admin/directors",
  },
  {
    id: "periods",
    label: "Periodos académicos",
    icon: Calendar,
    href: "/admin/periods",
  },
  {
    id: "logs",
    label: "Logs del sistema",
    icon: FileText,
    href: "/admin/logs",
  },
];

const TEACHER_NAV: NavItem[] = [
  { id: "summary", label: "Mi resumen", icon: Users, href: "/me/summary" },
  { id: "history", label: "Histórico", icon: TrendingUp, href: "/me/history" },
  { id: "profile", label: "Perfil", icon: FileText, href: "/me/profile" },
];

export const ROLE_NAV: Record<AppRole, NavItem[]> = {
  director: DIRECTOR_NAV,
  admin: ADMIN_NAV,
  teacher: TEACHER_NAV,
};
