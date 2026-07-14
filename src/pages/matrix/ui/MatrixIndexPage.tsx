import { BarChart3, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'wouter'

import { usePeriodsStore } from '@/features/periods'
import { useGetTeachers } from '@/features/teachers'
import { cn } from '@/shared/lib/utils'
import { Avatar, Input } from '@/shared/ui'
import { AppLayout } from '@/widgets/layout'

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
    <AppLayout
      header={{ rightMode: 'periodo' }}
      mainClassName='p-0 lg:p-0 flex overflow-hidden'
    >
      {/* ── Left panel: teacher list ─────────────────────── */}
      <aside className='flex w-72 shrink-0 flex-col border-r border-border bg-background'>
        {/* Panel header */}
        <div className='border-b border-border px-4 pb-4 pt-5'>
          <p className='text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground'>
            Matrices de evaluación
          </p>
          <h2 className='mt-0.5 text-[15px] font-semibold text-foreground'>
            Docentes
          </h2>
          {selectedPeriod && (
            <span className='mt-1.5 inline-flex items-center rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-brand-700'>
              {selectedPeriod.name}
            </span>
          )}
        </div>

        {/* Search */}
        <div className='border-b border-border px-3 py-2.5'>
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Buscar docente...'
            icon={<Search size={14} />}
          />
        </div>

        {/* Teacher list */}
        <div className='flex-1 overflow-y-auto py-1.5'>
          {isLoading ? (
            <div className='space-y-1 px-2'>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className='h-14 animate-pulse rounded-lg bg-muted'
                />
              ))}
            </div>
          ) : teachers.length === 0 ? (
            <div className='px-4 py-8 text-center'>
              <p className='text-[12px] text-muted-foreground'>
                {search ? 'Sin resultados para la búsqueda.' : 'No hay docentes activos.'}
              </p>
            </div>
          ) : (
            <ul className='space-y-0.5 px-2'>
              {teachers.map((teacher) => {
                const name = teacher.user?.name ?? '—'
                const href = `/matrix/${teacher.id}`
                const active =
                  location === href || location.startsWith(`${href}/`)

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
                      <Avatar
                        name={name}
                        src={teacher.user?.avatar_url || undefined}
                        size={32}
                        paletteIndex={teacher.id % 8}
                      />
                      <div className='min-w-0 flex-1'>
                        <div
                          className={cn(
                            'truncate text-[13px] font-medium leading-tight',
                            active ? 'text-brand-900' : 'text-foreground',
                          )}
                        >
                          {name}
                        </div>
                        <div className='mt-0.5 text-[11px] text-muted-foreground'>
                          {teacher.institutional_code}
                        </div>
                      </div>
                      {active && (
                        <span className='h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600' />
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
          <div className='border-t border-border px-4 py-3 text-[11px] text-muted-foreground'>
            {teachers.length} docente{teachers.length !== 1 ? 's' : ''} activo
            {teachers.length !== 1 ? 's' : ''}
          </div>
        )}
      </aside>

      {/* ── Right panel: empty state ──────────────────────── */}
      <div className='flex flex-1 flex-col items-center justify-center gap-5 bg-muted p-12 text-center'>
        <div className='flex h-20 w-20 items-center justify-center rounded-2xl bg-card shadow-sm ring-1 ring-border'>
          <BarChart3 size={36} className='text-muted-foreground' />
        </div>

        <div className='max-w-xs'>
          <h3 className='text-[17px] font-semibold text-foreground'>
            Selecciona un docente
          </h3>
          <p className='mt-2 text-[13px] leading-relaxed text-muted-foreground'>
            Elige un docente de la lista para ver el reporte detallado de su
            evaluación docente
            {selectedPeriod ? ` en el periodo ${selectedPeriod.name}` : ''}.
          </p>
        </div>

        {!selectedPeriod && (
          <div className='rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-[12px] text-amber-700'>
            Selecciona un periodo académico en la barra superior
          </div>
        )}
      </div>
    </AppLayout>
  )
}
