import { LogOut, X } from "lucide-react";
import { Link, useLocation } from "wouter";

import { cn } from "@/shared/lib/utils";
import { BrandMark } from "@/shared/ui";
import { ROLE_NAV, ROLE_SUBTITLE, type AppRole } from "../model/nav";
import useAuth from "@/shared/hooks/useAuth";

export interface AppSidebarProps {
  role: AppRole;
  mobileOpen: boolean;
  onClose: () => void;
}

export function AppSidebar({ role, mobileOpen, onClose }: AppSidebarProps) {
  const [location] = useLocation();

  const { handleLogout } = useAuth();

  const items = ROLE_NAV[role];

  const isActive = (href: string) =>
    href !== "#" && (location === href || location.startsWith(`${href}/`));

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-ink-900/40 backdrop-blur-[2px] transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[244px] shrink-0 flex-col border-r border-ink-200 bg-white transition-transform lg:sticky lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Logo */}
        <div className="flex h-[68px] items-center gap-2.5 border-b border-ink-100 px-5">
          <BrandMark size={36} iconSize={18} />
          <div className="leading-tight">
            <div className="text-[14px] font-semibold text-ink-900">
              Evaluación Docente
            </div>
            <div className="-mt-0.5 text-[11px] text-ink-500">
              {ROLE_SUBTITLE[role]}
            </div>
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
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
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
                    <span>{item.label}</span>
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
