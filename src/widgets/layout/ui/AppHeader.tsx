import { Bell, Calendar, Menu, Search } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Input } from "@/shared/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import Avatar from "@/features/auth/components/Avatar";

export interface AppHeaderProps {
  onOpenMenu: () => void;
  showBreadcrumb?: boolean;
  breadcrumb?: ReactNode;
  userName?: string;
  userRole?: string;
  /** Right-side control: academic-period selector or a teacher search box. */
  rightMode?: "periodo" | "search";
}

const PERIODS = ["2024-1", "2023-2", "2023-1"];

export function AppHeader({
  onOpenMenu,
  showBreadcrumb = false,
  breadcrumb,
  userName = "Director Depto.",
  userRole = "Ciencias Básicas",
  rightMode = "periodo",
}: AppHeaderProps) {
  const [periodo, setPeriodo] = useState("2024-1");

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/85 backdrop-blur-md">
      <div className="flex h-[68px] items-center gap-3 px-4 lg:px-8">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-700 hover:bg-ink-100 lg:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>

        {showBreadcrumb && breadcrumb && (
          <nav className="hidden min-w-0 items-center gap-1.5 text-[13px] text-ink-500 sm:flex">
            {breadcrumb}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {rightMode === "search" ? (
            <div className="hidden w-[260px] md:block">
              <Input
                placeholder="Buscar docente..."
                icon={<Search size={14} />}
              />
            </div>
          ) : (
            <div className="hidden h-9 items-center gap-2 rounded-md border border-ink-200 bg-white px-3 text-[13px] text-ink-700 md:flex">
              <Calendar size={14} className="text-ink-400" />
              <span>Periodo Académico:</span>
              <Select
                value={periodo}
                onValueChange={(value) => setPeriodo(value as string)}
              >
                <SelectTrigger
                  aria-label="Periodo académico"
                  className="h-auto gap-1 border-0 bg-transparent p-0 text-[13px] font-medium text-ink-900 shadow-none data-[size=default]:h-auto focus-visible:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink-200 bg-white text-ink-700 hover:bg-ink-50"
            aria-label="Notificaciones"
          >
            <Bell size={16} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-600 ring-2 ring-white" />
          </button>

          <Avatar />
        </div>
      </div>
    </header>
  );
}
