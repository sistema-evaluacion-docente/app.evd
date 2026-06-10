import { cn } from "@/shared/lib/utils";
import {
  BarChart3,
  Calendar,
  FileText,
  LayoutGrid,
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
  "/admin/directors": UserSearch,
  "/admin/periods": Calendar,
  "/admin/logs": FileText,
  "/me/summary": Users,
  "/me/history": TrendingUp,
  "/me/profile": FileText,
};

export function AppSidebar({ mobileOpen, onClose }: AppSidebarProps) {
  const [location] = useLocation();

  const { handleLogout, selectedRole } = useAuth();

  const role = selectedRole ?? "docente";
  const items = getMenus(role);

  const isActive = (href: string) =>
    href !== "#" && (location === href || location.startsWith(`${href}/`));

  return (
    <>
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[244px] shrink-0 flex-col border-r border-ink-200 bg-white transition-transform lg:sticky lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-17 items-center gap-2.5 border-b border-ink-100 px-5">
          <BrandMark size={36} iconSize={18} />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-ink-900">
              Evaluación Docente
            </div>

            <div className="-mt-0.5 text-[11px] text-ink-500">{role}</div>
          </div>

          <button
            type="button"
            className="ml-auto text-ink-500 hover:text-ink-900 lg:hidden"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <div className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-400">
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
                      "group flex h-9 w-full items-center gap-3 rounded-md px-2.5 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-brand-50 text-brand-700"
                        : "text-ink-600 hover:bg-ink-50 hover:text-ink-900",
                    )}
                  >
                    <Icon
                      size={16}
                      className={
                        active
                          ? "text-brand-600"
                          : "text-ink-500 group-hover:text-ink-700"
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
            className="border-ink-100 p-3 text-xs cursor-pointer flex h-9 w-full items-center gap-3 rounded-md px-2.5 font-medium text-brand-600 transition-colors hover:bg-brand-50"
          >
            <LogOut size={16} />
            <span>Cerrar Sesión</span>
          </div>
        </div>
      </aside>
    </>
  );
}
