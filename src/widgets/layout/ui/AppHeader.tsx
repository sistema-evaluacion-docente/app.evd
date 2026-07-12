import { ThemeSwitcher } from "@/components/common/ThemeSwitcher";
import { Input } from "@/shared/ui";
import { Bell, Calendar, Menu, Search } from "lucide-react";
import type { ReactNode } from "react";

import Avatar from "@/features/auth/components/Avatar";
import { PeriodsSelector } from "@/features/periods";

export interface AppHeaderProps {
  onOpenMenu: () => void;
  showBreadcrumb?: boolean;
  breadcrumb?: ReactNode;
  userName?: string;
  userRole?: string;
  /** Right-side control: academic-period selector or a teacher search box. */
  rightMode?: "periodo" | "search";
}

export function AppHeader({
  onOpenMenu,
  showBreadcrumb = false,
  breadcrumb,
  rightMode = "periodo",
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b backdrop-blur-md">
      <div className="flex h-17 items-center gap-3 px-4 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-ink-100 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>

        {showBreadcrumb && breadcrumb && (
          <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] text-muted-foreground sm:flex">
            {breadcrumb}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {rightMode === "search" ? (
            <div className="hidden w-65 md:block">
              <Input
                placeholder="Buscar docente..."
                icon={<Search size={14} />}
              />
            </div>
          ) : (
            <div className="hidden items-center gap-2 md:flex">
              <Calendar size={14} className="text-muted-foreground" />

              <span className="whitespace-nowrap text-[13px]">
                Periodo Académico:
              </span>

              <PeriodsSelector />
            </div>
          )}

          <ThemeSwitcher />

          <button
            type="button"
            className="cursor-pointer relative inline-flex h-9 w-9 items-center justify-center rounded-md border hover:bg-card"
            aria-label="Notificaciones"
          >
            <Bell size={16} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-600 ring-2" />
          </button>

          <Avatar />
        </div>
      </div>
    </header>
  );
}
