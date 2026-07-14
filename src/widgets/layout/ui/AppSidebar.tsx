import { cn } from "@/shared/lib/utils";
import {
  BarChart3,
  Building2,
  Clock,
  FileText,
  LayoutGrid,
  Library,
  LogOut,
  TrendingUp,
  UserSearch,
  Users,
  X,
} from "lucide-react";
import { Link, useLocation } from "wouter";

import { getMenus } from "@/config/security";
import useAuth from "@/shared/hooks/useAuth";
import { BrandMark } from "@/shared/ui";

export interface AppSidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

const DEFAULT_ICON = FileText;

const MENU_ICON_BY_PATH: Record<string, typeof DEFAULT_ICON> = {
  "/dashboard": LayoutGrid,
  "/teachers": Users,
  "/matrix": BarChart3,
  "/plans": TrendingUp,
  "/users": Users,
  "/roles": UserSearch,
  "/documents": FileText,
  "/faculties": Building2,
  "/departments": Library,
  "/admin/directors": UserSearch,
  "/periods": Clock,
  "/admin/logs": FileText,
  "/me/summary": Users,
  "/me/history": TrendingUp,
  "/me/profile": FileText,
};

export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const [location] = useLocation();

  const { handleLogout, selectedRole } = useAuth();

  if (!selectedRole) {
    return null;
  }

  const items = getMenus(selectedRole);

  const isActive = (href: string) =>
    href !== "#" && (location === href || location.startsWith(`${href}/`));

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-75 shrink-0 flex-col border-r bg-background transition-transform lg:sticky lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-17 items-center gap-2.5 border-b px-5">
          <BrandMark size={36} iconSize={18} />

          <div className="leading-tight">
            <div className="text-sm font-semibold">
              Evaluación Docente
            </div>
          </div>

          <button
            type="button"
            className="ml-auto text-muted-foreground lg:hidden cursor-pointer"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Menú principal
          </div>

          <ul className="space-y-0.5">
            {items.map((item) => {
              const Icon = MENU_ICON_BY_PATH[item.path] ?? DEFAULT_ICON;
              const active = isActive(item.path);

              return (
                <li key={item.path}>
                  <Link
                    href={item.path}
                    onClick={onClose}
                    className={cn(
                      "group flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-xs font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon
                      size={16}
                      className={
                        active
                          ? "text-brand-600"
                          : "text-muted-foreground group-hover:text-foreground"
                      }
                    />

                    <span>{item.name}</span>

                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-600" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="border-t p-2">
          <div
            onClick={handleLogout}
            className="p-3 text-xs cursor-pointer flex h-9 w-full items-center gap-3 rounded-md px-2.5 font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </div>
        </div>
      </aside>
    </>
  );
}
