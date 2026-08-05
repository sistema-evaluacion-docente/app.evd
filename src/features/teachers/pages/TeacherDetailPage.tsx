import { useRoute, useSearchParams } from 'wouter'

import { PageTitle } from '@/components/common/PageTitle'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useGetTeacherDetail } from '../api'

/**
 * Full page displaying the detail of a single teacher for a specific academic period.
 * Route: `/docentes/:id?period=<period_name>`
 */
export default function TeacherDetailPage() {
  const [, params] = useRoute('/docentes/:id')
  const [searchParams] = useSearchParams()

  const teacherId = params?.id ? Number(params.id) : undefined
  const periodName = searchParams.get('period') ?? undefined

  const { data, isLoading } = useGetTeacherDetail({ teacherId, periodName })
  const teacher = data?.data

  if (isLoading) {
    return (
      <>
        <PageTitle>Detalle del docente</PageTitle>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Skeleton className="size-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
            </CardHeader>

            <CardContent>
              <Skeleton className="h-24" />
            </CardContent>
          </Card>
        </div>
      </>
    )
  }

  if (!teacher) {
    return (
      <>
        <PageTitle>Detalle del docente</PageTitle>
        <p className="text-muted-foreground text-center">No se encontró el docente.</p>
      </>
    )
  }

  return (
    <>
      <PageTitle>{teacher.name}</PageTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="border-border/70 size-16 border">
                <AvatarImage src={teacher.avatar_url} alt={teacher.name} />

                <AvatarFallback className="text-lg font-semibold">
                  {teacher.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col">
                <span className="text-lg font-semibold">{teacher.name}</span>
                <span className="text-muted-foreground text-sm">
                  {teacher.institutional_code || 'Sin código'}
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Tipo de contrato
                </p>

                <p className="mt-1 text-sm font-medium">{teacher.contract_type || '—'}</p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                  Periodo académico
                </p>

                <p className="mt-1 text-sm font-medium">{teacher.period_name || '—'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Resumen</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-muted-foreground mb-1 text-xs font-medium tracking-wide uppercase">
                Promedio general
              </p>

              <ScoreBadge value={teacher.overall_average} decimals={2} className="text-2xl" />
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground text-sm">Grupos evaluados</span>
                <span className="text-lg font-semibold tabular-nums">{teacher.group_count}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
