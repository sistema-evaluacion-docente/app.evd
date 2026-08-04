import { useMemo, useState } from 'react'
import { useSearchParams } from 'wouter'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  TeacherNoEvaluationState,
  useGetTeacherDetailByPeriod,
  type TeacherEvaluationDetailResponse,
} from '@/features/evaluations'
import { ScoreBarInline } from '@/features/evaluations/components/ScoreBarInline'
import { ProfessorCategoryChart } from '@/features/teachers/components/professor-summary/ProfessorCategoryChart'
import { ProfessorCategoryDetail } from '@/features/teachers/components/professor-summary/ProfessorCategoryDetail'
import {
  professorScoreTone,
  type ProfessorCategory,
} from '@/features/teachers/model/professorSummary'
import { StatTile } from '@/shared/ui'
import { Building2, Calendar } from 'lucide-react'

type Props = {
  teacherId: number
}

function mapDimensionsToCategories(
  dimensions: TeacherEvaluationDetailResponse['dimensions'],
): ProfessorCategory[] {
  return dimensions.map((d) => ({
    id: d.dimension,
    name: d.dimension,
    score: d.average,
    previousScore: 0,
    questions: (d.questions ?? []).map((q) => ({
      code: q.code,
      text: q.text,
      mine: q.score,
      previous: 0,
    })),
    comments: [],
  }))
}

function SidebarSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
      <Skeleton className="h-28 w-full" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  )
}

function CoursesList({ data }: { data: TeacherEvaluationDetailResponse }) {
  if (!data.courses.length) return null

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Promedio por Materia</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {data.courses.map((course) => (
            <li
              key={`${course.course_code}-${course.group_name}`}
              className="flex items-center justify-between gap-4 py-3.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">
                  {course.course_name} ({course.group_name})
                </p>
              </div>
              <div className="flex shrink-0 items-baseline gap-0.5 tabular-nums">
                <span
                  className={`num text-lg font-semibold ${professorScoreTone(course.overall_average)}`}
                >
                  {course.overall_average?.toFixed(2) ?? '—'}
                </span>
                <span className="text-muted-foreground text-sm font-medium">/5.0</span>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}

function TeacherDetailContent({ teacherId }: Props) {
  const [searchParams] = useSearchParams()
  const period = searchParams.get('period') ?? undefined
  const [categoryId, setCategoryId] = useState<string | null>(null)

  const { data, isLoading } = useGetTeacherDetailByPeriod(teacherId, period)
  const detail = data?.data

  const categories = useMemo(
    () => (detail ? mapDimensionsToCategories(detail.dimensions) : []),
    [detail],
  )

  const selectedCategory = categoryId ? (categories.find((c) => c.id === categoryId) ?? null) : null

  if (!period) {
    return <TeacherNoEvaluationState />
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[320px_1fr]">
        <SidebarSkeleton />
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    )
  }

  if (!detail) {
    return <TeacherNoEvaluationState />
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[350px_1fr]">
      <aside className="space-y-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 shrink-0">
                <AvatarFallback>{detail.name?.at(0)?.toUpperCase() ?? '?'}</AvatarFallback>
                <AvatarImage src={detail.avatar_url ?? ''} alt={detail.name ?? ''} />
              </Avatar>
              <div className="min-w-0">
                <h1 className="text-xl font-semibold">{detail.name ?? '—'}</h1>
                <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                  <Building2 size={14} />
                  Cód. {detail.institutional_code}
                </p>
                <p className="text-muted-foreground mt-1 flex items-center gap-1.5 text-sm">
                  <Calendar size={14} />
                  <Badge className="px-2 py-0.5 text-xs">{detail.period_name ?? '—'}</Badge>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <StatTile
          label="Promedio General"
          value={detail.overall_average?.toFixed(2) ?? '—'}
          valueClassName={professorScoreTone(detail.overall_average ?? 0)}
          sub="/ 5.0"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dimensiones</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {detail.dimensions.map((dim) => (
                <li key={dim.dimension} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium">{dim.dimension}</span>
                  <ScoreBarInline score={dim.average} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </aside>

      <div className="space-y-6">
        {selectedCategory ? (
          <ProfessorCategoryDetail
            category={selectedCategory}
            categories={categories}
            comments={[]}
            teacherId={teacherId}
            onBack={() => setCategoryId(null)}
            onSelect={setCategoryId}
          />
        ) : (
          <ProfessorCategoryChart categories={categories} onSelect={setCategoryId} />
        )}

        <CoursesList data={detail} />
      </div>
    </div>
  )
}

export default TeacherDetailContent
