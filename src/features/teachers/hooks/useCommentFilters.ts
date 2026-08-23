import { useMemo, useState } from 'react'
import { useDebounce } from 'use-debounce'

import { categoryLabel } from '@/lib/categoryLabel'
import type { TeacherComment, TeacherCommentsCourse } from '../types'

/** A selectable filter option derived from the loaded comments. */
export interface CommentFilterOption {
  id: number
  name: string
  color_hex: string
  /** How many comments currently match this option (before other filters). */
  count: number
}

interface UseCommentFiltersOptions {
  /** Debounce applied to the search text, in ms. Defaults to 300. */
  debounceMs?: number
}

/**
 * Client-side search/filter state for a teacher's comments. The endpoint
 * returns every comment at once, so filtering happens in memory: free-text
 * search over the comment body, course, group and category, plus optional
 * risk-level and pedagogical-category filters. Options are derived from the
 * data, so no hardcoded catalogs are needed.
 *
 * @returns The filter state and setters, the derived option lists, and the
 * courses with their comments already filtered (empty courses removed) and
 * sorted by risk score, highest first.
 *
 * @example
 * const { search, setSearch, riskLevels, filteredCourses } = useCommentFilters(data?.courses);
 */
export function useCommentFilters(
  courses: TeacherCommentsCourse[] | undefined,
  { debounceMs = 300 }: UseCommentFiltersOptions = {},
) {
  const [search, setSearch] = useState('')
  const [riskLevelId, setRiskLevelId] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [debouncedSearch] = useDebounce(search, debounceMs)

  const allCourses = useMemo(() => courses ?? [], [courses])

  const totalCount = useMemo(
    () => allCourses.reduce((acc, course) => acc + course.comments.length, 0),
    [allCourses],
  )

  const { riskLevels, categories } = useMemo(() => {
    const riskMap = new Map<number, CommentFilterOption>()
    const categoryMap = new Map<number, CommentFilterOption>()

    for (const course of allCourses) {
      for (const comment of course.comments) {
        countInto(riskMap, comment.risk_level)
        comment.pedagogical_categories.forEach((category) => countInto(categoryMap, category))
      }
    }

    return {
      riskLevels: [...riskMap.values()],
      categories: [...categoryMap.values()],
    }
  }, [allCourses])

  const filteredCourses = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase()
    const hasFilters = term !== '' || riskLevelId !== null || categoryId !== null

    return allCourses
      .map((course) => ({
        ...course,
        comments: course.comments
          .filter((comment) => {
            if (!hasFilters) return true

            if (riskLevelId !== null && comment.risk_level?.id !== riskLevelId) return false

            if (
              categoryId !== null &&
              !comment.pedagogical_categories.some((category) => category.id === categoryId)
            )
              return false

            if (term === '') return true

            return [
              comment.original_text,
              comment.course_name,
              comment.group_name,
              ...comment.pedagogical_categories.map((category) => categoryLabel(category.name)),
              comment.risk_level?.name,
            ]
              .filter((field): field is string => Boolean(field))
              .some((field) => field.toLowerCase().includes(term))
          })
          .sort(byRiskScoreDescending),
      }))
      .filter((course) => course.comments.length > 0)
  }, [allCourses, categoryId, debouncedSearch, riskLevelId])

  const filteredCount = useMemo(
    () => filteredCourses.reduce((acc, course) => acc + course.comments.length, 0),
    [filteredCourses],
  )

  const isFiltered = search !== '' || riskLevelId !== null || categoryId !== null

  function reset() {
    setSearch('')
    setRiskLevelId(null)
    setCategoryId(null)
  }

  return {
    search,
    setSearch,
    debouncedSearch,
    riskLevelId,
    setRiskLevelId,
    categoryId,
    setCategoryId,
    riskLevels,
    categories,
    filteredCourses,
    totalCount,
    filteredCount,
    isFiltered,
    reset,
  }
}

/**
 * Highest `risk_score` first, so the comments most worth a reader's
 * attention lead each course's list instead of sitting in upload order.
 * Comments not yet classified (`risk_score == null`) sort last — there's no
 * risk to rank them by yet.
 */
function byRiskScoreDescending(a: TeacherComment, b: TeacherComment): number {
  if (a.risk_score == null) return b.risk_score == null ? 0 : 1
  if (b.risk_score == null) return -1

  return b.risk_score - a.risk_score
}

function countInto(
  map: Map<number, CommentFilterOption>,
  option?: { id: number; name: string; color_hex: string } | null,
) {
  if (!option) return

  const existing = map.get(option.id)

  if (existing) {
    existing.count += 1
    return
  }

  map.set(option.id, {
    id: option.id,
    name: option.name,
    color_hex: option.color_hex,
    count: 1,
  })
}
