import { Bell, Calendar, ChevronDown, Menu, Search } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Avatar, Input } from '@/shared/ui'

export interface AppHeaderProps {
  onOpenMenu: () => void
  showBreadcrumb?: boolean
  breadcrumb?: ReactNode
  userName?: string
  userRole?: string
  /** Right-side control: academic-period selector or a teacher search box. */
  rightMode?: 'periodo' | 'search'
}

const PERIODS = ['2024-1', '2023-2', '2023-1']

export function AppHeader({
  onOpenMenu,
  showBreadcrumb = false,
  breadcrumb,
  userName = 'Director Depto.',
  userRole = 'Ciencias Básicas',
  rightMode = 'periodo',
}: AppHeaderProps) {
  const [periodo, setPeriodo] = useState('2024-1')

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
          {rightMode === 'search' ? (
            <div className="hidden w-[260px] md:block">
              <Input placeholder="Buscar docente..." icon={<Search size={14} />} />
            </div>
          ) : (
            <div className="hidden h-9 items-center gap-2 rounded-md border border-ink-200 bg-white px-3 text-[13px] text-ink-700 md:flex">
              <Calendar size={14} className="text-ink-400" />
              <span>Periodo Académico:</span>
              <select
                value={periodo}
                onChange={(event) => setPeriodo(event.target.value)}
                className="cursor-pointer appearance-none bg-transparent pr-4 font-medium text-ink-900 focus:outline-none"
                aria-label="Periodo académico"
              >
                {PERIODS.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none -ml-3 text-ink-500"
              />
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

          <div className="ml-1 flex items-center gap-2.5 border-l border-ink-200 pl-2 sm:pl-3">
            <div className="hidden text-right leading-tight sm:block">
              <div className="text-[13px] font-semibold text-ink-900">
                {userName}
              </div>
              <div className="text-[11px] text-ink-500">{userRole}</div>
            </div>
            <div className="relative">
              <Avatar name={userName} size={36} paletteIndex={6} />
              <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
