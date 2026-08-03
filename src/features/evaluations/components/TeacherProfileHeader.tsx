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
          <Avatar className="h-16 w-16 sm:h-20 sm:w-20">
            <AvatarFallback>{teacherName.at(0)?.toUpperCase()}</AvatarFallback>
            <AvatarImage src={teacher?.user?.avatar_url ?? ''} alt={teacherName} />
          </Avatar>

          {teacher?.active && (
            <span className="absolute right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          )}
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
              <h1 className="text-xl leading-tight font-semibold tracking-tight sm:text-xl">
                {teacherName}
              </h1>

              <ul className="text-muted-foreground mt-1 flex flex-col flex-wrap gap-x-5 gap-y-1.5 text-xs sm:text-sm">
                <li className="inline-flex items-center gap-2">
                  <Building2 size={14} className="text-muted-foreground" />
                  Cód. {teacher?.institutional_code ?? '—'}
                </li>

                <li className="inline-flex items-center gap-2">
                  <Calendar size={14} className="text-muted-foreground" /> Periodo Académico:{' '}
                  <Badge>{periodLabel}</Badge>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
    </>
  )
}
