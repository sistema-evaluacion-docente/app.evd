import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Calendar } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import type { TeacherEvaluationDetail } from '@/features/evaluations'
import { usePeriodsStore } from '@/features/periods'
import type { Teacher } from '@/features/teachers'
import type { ResponseAPI } from '@/shared/types/Response'

interface TeacherProfileHeaderProps {
  teacherId: number
  teacher?: ResponseAPI<Teacher>
  evaluationDetail?: TeacherEvaluationDetail
}

export default function TeacherProfileHeader({
  teacher: teacherProp,
  evaluationDetail: detail,
}: TeacherProfileHeaderProps) {
  const { selectedPeriod } = usePeriodsStore()

  const teacher = teacherProp?.data

  const teacherName = detail?.name ?? teacher?.user?.name ?? '—'
  const periodLabel = detail?.period_name ?? selectedPeriod?.name ?? '—'

  const isLoading = !teacherProp

  return (
    <>
      <div className="mb-10 flex items-center gap-4">
        <div className="relative shrink-0">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28">
            <AvatarFallback>{teacherName.at(0)?.toUpperCase()}</AvatarFallback>
            <AvatarImage src={teacher?.user?.avatar_url ?? ''} alt={teacherName} />
          </Avatar>
        </div>

        <div className="min-w-0 flex-1">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-56" />

              <div className="flex flex-wrap gap-x-5 gap-y-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-40" />
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-xl leading-tight font-semibold tracking-tight md:text-2xl lg:text-3xl">
                {teacherName}
              </h1>

              <ul className="text-muted-foreground mt-1 flex flex-col flex-wrap gap-x-5 gap-y-1.5 text-xs md:text-sm lg:text-base">
                <li className="inline-flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  Cód. {teacher?.institutional_code ?? '—'}
                </li>

                <li className="inline-flex items-center gap-2">
                  <Calendar size={14} className="text-muted-foreground" /> Periodo Académico:{' '}
                  <Badge className="text-sm px-2 py-1">{periodLabel}</Badge>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}
