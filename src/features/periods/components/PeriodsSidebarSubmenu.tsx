import { ChevronRight, Layers } from 'lucide-react'
import { useState } from 'react'
import { useLocation } from 'wouter'

import { PeriodSelect, type PeriodSelectOption } from '@/components/common/PeriodSelect'
import { ScoreBadge } from '@/components/common/ScoreBadge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { Spinner } from '@/components/ui/spinner'
import { useAuthStore } from '@/features/auth'
import { useGetTeacherDetail } from '@/features/teachers'
import { useNavigate } from '@/hooks/useNavigate'
import { useGetTeacherHistory } from '../api'
import type { TeacherPeriodHistory } from '../types'

const PERIOD_ROUTE = /^\/periodos\/([^/]+)/

function courseHref(period: string, courseCode: string, groupName: string) {
  const encodedPeriod = encodeURIComponent(period)
  const encodedCourse = encodeURIComponent(courseCode)
  const encodedGroup = encodeURIComponent(groupName)

  return `/periodos/${encodedPeriod}/materias/${encodedCourse}/${encodedGroup}`
}

/**
 * "Materias" disclosure rendered under "Mis periodos" for role DOCENTE: a
 * period selector followed by the subjects the teacher had in that period,
 * each linking to its own detail page. Changing the period only refreshes
 * this list in place — it never navigates on its own, so it stays usable no
 * matter which page is currently open. Only picking a subject navigates.
 *
 * @example
 * <PeriodsSidebarSubmenu />
 */
export function PeriodsSidebarSubmenu() {
  const [location] = useLocation()
  const teacherId = useAuthStore((state) => state.user?.teacher_id) ?? undefined

  const routeMatch = location.match(PERIOD_ROUTE)
  const routePeriod = routeMatch ? decodeURIComponent(routeMatch[1]) : undefined

  const { data: historyData, isLoading: isHistoryLoading } = useGetTeacherHistory({
    limit: 50,
    sort_by: 'period_code_desc',
  })
  const periods = historyData?.data ?? []

  if (!teacherId) {
    return null
  }

  return (
    <Collapsible defaultOpen={Boolean(routePeriod)} className="group/materias mt-1">
      <CollapsibleTrigger
        render={<SidebarMenuSubButton render={<button type="button" />} />}
        className="w-full cursor-pointer justify-between gap-2"
      >
        <span className="flex items-center gap-1.5">
          <Layers className="size-3.5" aria-hidden="true" />
          Materias
        </span>
        <ChevronRight className="size-3.5 shrink-0 transition-transform group-data-panel-open/materias:rotate-90" />
      </CollapsibleTrigger>

      <CollapsibleContent>
        <SidebarMenuSub className="mt-1">
          {isHistoryLoading ? (
            <SidebarMenuSubItem className="flex justify-center py-2">
              <Spinner className="text-muted-foreground size-4" />
            </SidebarMenuSubItem>
          ) : periods.length === 0 ? (
            <SidebarMenuSubItem className="text-muted-foreground px-2 py-1.5 text-xs">
              Sin periodos evaluados
            </SidebarMenuSubItem>
          ) : (
            // Keyed on the route's period: navigating to a different one (e.g.
            // after picking a subject below) remounts this with a fresh
            // "browsing" state instead of needing an effect to resync it.
            <PeriodCourseList
              key={routePeriod ?? '_latest'}
              routePeriod={routePeriod}
              periods={periods}
              teacherId={teacherId}
            />
          )}
        </SidebarMenuSub>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface PeriodCourseListProps {
  /** The period the current route is on, if any — the fallback default. */
  routePeriod?: string
  periods: TeacherPeriodHistory[]
  teacherId: number
}

function PeriodCourseList({ routePeriod, periods, teacherId }: PeriodCourseListProps) {
  const [location] = useLocation()
  const navigate = useNavigate()
  const { setOpenMobile } = useSidebar()

  const [browsePeriod, setBrowsePeriod] = useState<string>()
  const selectedPeriod = browsePeriod ?? routePeriod ?? periods[0]?.period_code

  const { data: detailData, isLoading: isCoursesLoading } = useGetTeacherDetail({
    teacherId,
    periodName: selectedPeriod,
  })
  const courses = detailData?.data.courses ?? []

  const periodOptions: PeriodSelectOption[] = periods.map((period) => ({
    id: period.period_id,
    name: period.period_name ?? period.period_code,
    code: period.period_code,
  }))
  const selectedOption = periodOptions.find((option) => option.code === selectedPeriod)

  function goToCourse(href: string) {
    setOpenMobile(false)
    navigate(href)
  }

  return (
    <>
      <SidebarMenuSubItem className="px-0.5 pb-1.5">
        <PeriodSelect
          options={periodOptions}
          value={selectedOption?.id}
          onValueChange={(id) => {
            const period = periodOptions.find((option) => option.id === id)
            if (period) setBrowsePeriod(period.code)
          }}
          size="sm"
          className="w-full"
          ariaLabel="Periodo"
        />
      </SidebarMenuSubItem>

      {isCoursesLoading ? (
        <SidebarMenuSubItem className="text-muted-foreground px-2 py-1.5 text-xs">
          Cargando materias…
        </SidebarMenuSubItem>
      ) : courses.length === 0 ? (
        <SidebarMenuSubItem className="text-muted-foreground px-2 py-1.5 text-xs">
          Sin materias registradas
        </SidebarMenuSubItem>
      ) : (
        courses.map((course) => {
          const href = courseHref(selectedPeriod, course.course_code, course.group_name)
          const isActive = location === href

          return (
            <SidebarMenuSubItem key={`${course.course_code}-${course.group_name}`}>
              <SidebarMenuSubButton
                render={<button type="button" />}
                isActive={isActive}
                className="h-auto min-h-7 w-full cursor-pointer items-start gap-2 py-1.5"
                onClick={() => goToCourse(href)}
              >
                <span className="min-w-0 flex-1 text-left leading-snug wrap-break-word">
                  {course.course_name}
                </span>
                <ScoreBadge value={course.overall_average} size="xs" className="shrink-0 pt-0.5" />
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          )
        })
      )}
    </>
  )
}
