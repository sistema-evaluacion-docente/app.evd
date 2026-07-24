import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { usePeriodsStore } from '@/features/periods'
import { useGetTeachers } from '@/features/teachers'
import { cn } from '@/lib/utils'
import { AppLayout } from '@/widgets/layout'
import { BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'wouter'

export function MatrixIndexPage() {
  const [search, setSearch] = useState('')
  const [location] = useLocation()
  const { selectedPeriod } = usePeriodsStore()

  const { data, isLoading } = useGetTeachers({ page: 1, limit: 100, search: '' })
  const teachers = (data?.data ?? []).filter((t) => {
    if (!t.active) return false
    if (!search) return true
    const q = search.toLowerCase()
    const name = (t.user?.name ?? '').toLowerCase()
    const username = (t.user?.username ?? '').toLowerCase()
    const code = t.institutional_code.toLowerCase()
    return name.includes(q) || username.includes(q) || code.includes(q)
  })

  return (
    <AppLayout header={{ rightMode: 'periodo' }} mainClassName="p-0 lg:p-0 flex overflow-hidden">
      {/* ── Left panel: teacher list ─────────────────────── */}
      <aside className="border-border bg-background flex w-72 shrink-0 flex-col border-r">
        {/* Panel header */}
        <div className="border-border border-b px-4 pt-5 pb-4">
          <p className="text-muted-foreground text-[10.5px] font-semibold tracking-widest uppercase">
            Matrices de evaluación
          </p>
          <h2 className="text-foreground mt-0.5 text-[15px] font-semibold">Docentes</h2>
          {selectedPeriod && (
            <span className="bg-brand-50 text-brand-700 mt-1.5 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium">
              {selectedPeriod.name}
            </span>
          )}
        </div>

        {/* Search */}
        <div className="border-border border-b px-3 py-2.5">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar docente..."
          />
        </div>

        {/* Teacher list */}
        <div className="flex-1 overflow-y-auto py-1.5">
          {isLoading ? (
            <div className="space-y-1 px-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-muted h-14 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-muted-foreground text-[12px]">
                {search ? 'Sin resultados para la búsqueda.' : 'No hay docentes activos.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-0.5 px-2">
              {teachers.map((teacher) => {
                const name = teacher.user?.name ?? '—'
                const href = `/matrix/${teacher.id}`
                const active = location === href || location.startsWith(`${href}/`)

                return (
                  <li key={teacher.id}>
                    <Link
                      href={href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13px] transition-colors',
                        active
                          ? 'bg-brand-50 text-brand-700'
                          : 'text-foreground hover:bg-muted hover:text-foreground',
                      )}
                    >
                      <Avatar>
                        <AvatarFallback>
                          <span className="text-foreground text-[13px] font-medium">
                            {name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .toUpperCase()}
                          </span>
                        </AvatarFallback>

                        <AvatarImage src={teacher.user?.avatar_url || undefined} alt={name} />
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div
                          className={cn(
                            'truncate text-[13px] leading-tight font-medium',
                            active ? 'text-brand-900' : 'text-foreground',
                          )}
                        >
                          {name}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-[11px]">
                          {teacher.institutional_code}
                        </div>
                      </div>
                      {active && (
                        <span className="bg-brand-600 h-1.5 w-1.5 shrink-0 rounded-full" />
                      )}
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {/* Footer count */}
        {!isLoading && (
          <div className="border-border text-muted-foreground border-t px-4 py-3 text-[11px]">
            {teachers.length} docente{teachers.length !== 1 ? 's' : ''} activo
            {teachers.length !== 1 ? 's' : ''}
          </div>
        )}
      </aside>

      {/* ── Right panel: empty state ──────────────────────── */}
      <div className="bg-muted flex flex-1 flex-col items-center justify-center gap-5 p-12 text-center">
        <div className="bg-card ring-border flex h-20 w-20 items-center justify-center rounded-2xl shadow-sm ring-1">
          <BarChart3 size={36} className="text-muted-foreground" />
        </div>

        <div className="max-w-xs">
          <h3 className="text-foreground text-[17px] font-semibold">Selecciona un docente</h3>
          <p className="text-muted-foreground mt-2 text-[13px] leading-relaxed">
            Elige un docente de la lista para ver el reporte detallado de su evaluación docente
            {selectedPeriod ? ` en el periodo ${selectedPeriod.name}` : ''}.
          </p>
        </div>

        {!selectedPeriod && (
          <div className="rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-700">
            Selecciona un periodo académico en la barra superior
          </div>
        )}
      </div>
    </AppLayout>
  )
}
