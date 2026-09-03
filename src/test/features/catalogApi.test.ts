import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import * as comments from '@/features/comments/api'
import * as courses from '@/features/courses/api'
import * as departments from '@/features/departments/api'
import * as directors from '@/features/directors/api'
import * as faculties from '@/features/faculties/api'
import * as notifications from '@/features/notifications/api'
import * as periods from '@/features/periods/api'
import * as programs from '@/features/programs/api'
import * as users from '@/features/users/api'
import { askedNothing, renderApiHook, requestOf, settled } from '@/test/apiHarness'

/**
 * The catalogue features — faculties, departments, programs, courses, periods,
 * users, directors, comments, notifications — are the same CRUD shape repeated,
 * so they share one axios mock here instead of nine near-identical files.
 *
 * What each case pins down is the part that is *not* boilerplate: which filters
 * survive being empty, and which URL a mutation lands on.
 */

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const authUser = { current: { department_id: 3, teacher_id: 11 } as Record<string, number> | null }

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: authUser.current }),
}))

const mockApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
  authUser.current = { department_id: 3, teacher_id: 11 }
  mockApi.get.mockResolvedValue({ data: {} })
  mockApi.post.mockResolvedValue({ data: {} })
  mockApi.put.mockResolvedValue({ data: {} })
  mockApi.delete.mockResolvedValue({ data: undefined })
})

async function mutate<V>(hook: () => { mutateAsync: (vars: V) => Promise<unknown> }, vars: V) {
  const { result } = renderApiHook(hook)

  await act(async () => {
    await result.current.mutateAsync(vars)
  })
}

describe('faculties', () => {
  it('lists with the defaults, dropping an empty search', async () => {
    const call = await requestOf(() => faculties.useGetFaculties(), mockApi.get)

    expect(call[0]).toBe('/faculties/')
    expect(call[1].params).toEqual({ page: 1, limit: 10 })
  })

  it('keeps `active: false`, which is a filter and not an absent one', async () => {
    const call = await requestOf(
      () => faculties.useGetFaculties({ search: 'ing', active: false }),
      mockApi.get,
    )

    expect(call[1].params).toMatchObject({ search: 'ing', active: false })
  })

  it('creates, updates and deletes', async () => {
    await mutate(() => faculties.useCreateFaculty(), { name: 'Ingeniería' } as never)
    expect(mockApi.post).toHaveBeenCalledWith('/faculties/', { name: 'Ingeniería' })

    await mutate(() => faculties.useUpdateFaculty(), {
      facultyId: 2,
      payload: { name: 'Ing.' } as never,
    })
    expect(mockApi.put).toHaveBeenCalledWith('/faculties/2', { name: 'Ing.' })

    await mutate(() => faculties.useDeleteFaculty(), 2)
    expect(mockApi.delete).toHaveBeenCalledWith('/faculties/2')
  })
})

describe('departments', () => {
  it('narrows the list to a faculty', async () => {
    const call = await requestOf(
      () => departments.useGetDepartments({ facultyId: 2, active: true }),
      mockApi.get,
    )

    expect(call[0]).toBe('/departments/')
    expect(call[1].params).toMatchObject({ faculty_id: 2, active: true })
  })

  it('creates, updates and deletes', async () => {
    await mutate(() => departments.useCreateDepartment(), { name: 'Sistemas' } as never)
    expect(mockApi.post).toHaveBeenCalledWith('/departments/', { name: 'Sistemas' })

    await mutate(() => departments.useUpdateDepartment(), {
      departmentId: 3,
      payload: { name: 'Sist.' } as never,
    })
    expect(mockApi.put).toHaveBeenCalledWith('/departments/3', { name: 'Sist.' })

    await mutate(() => departments.useDeleteDepartment(), 3)
    expect(mockApi.delete).toHaveBeenCalledWith('/departments/3')
  })

  it('assigns and unassigns a director', async () => {
    await mutate(() => departments.useAssignDirector(), { departmentId: 3, userId: 7 })
    expect(mockApi.post).toHaveBeenCalledWith('/departments/3/director', { user_id: 7 })

    await mutate(() => departments.useUnassignDirector(), 3)
    expect(mockApi.delete).toHaveBeenCalledWith('/departments/3/director')
  })
})

describe('programs', () => {
  it('lists and fetches one', async () => {
    const list = await requestOf(() => programs.useGetPrograms({ search: 'sis' }), mockApi.get)

    expect(list[0]).toBe('/programs/')
    expect(list[1].params).toMatchObject({ search: 'sis' })

    expect(await askedNothing(() => programs.useGetProgramById(undefined), mockApi.get)).toBe(true)

    const one = await requestOf(() => programs.useGetProgramById(5), mockApi.get)

    expect(one[0]).toBe('/programs/5')
  })

  it('creates, updates and deletes', async () => {
    await mutate(() => programs.useCreateProgram(), { name: 'Ing. Sistemas' } as never)
    expect(mockApi.post).toHaveBeenCalledWith('/programs/', { name: 'Ing. Sistemas' })

    await mutate(() => programs.useUpdateProgram(), {
      programId: 5,
      payload: { name: 'IS' } as never,
    })
    expect(mockApi.put).toHaveBeenCalledWith('/programs/5', { name: 'IS' })

    await mutate(() => programs.useDeleteProgram(), 5)
    expect(mockApi.delete).toHaveBeenCalledWith('/programs/5')
  })
})

describe('courses', () => {
  it('scopes the list to the signed-in director’s department', async () => {
    const call = await requestOf(() => courses.useListCourses(), mockApi.get)

    expect(call[0]).toBe('/courses/')
    expect(call[1].params).toMatchObject({ department_id: 3 })
  })

  it('drops the scope when the caller passes null — the admin, unscoped', async () => {
    const call = await requestOf(() => courses.useListCourses({ departmentId: null }), mockApi.get)

    expect(call[1].params).not.toHaveProperty('department_id')
  })

  it('updates a course', async () => {
    await mutate(() => courses.useUpdateCourse(), {
      courseId: 8,
      payload: { name: 'Cálculo' } as never,
    })

    expect(mockApi.put).toHaveBeenCalledWith('/courses/8', { name: 'Cálculo' })
  })
})

describe('directors', () => {
  it('lists and can be held back', async () => {
    const call = await requestOf(
      () => directors.useGetDirectors({ search: 'ada', active: true }),
      mockApi.get,
    )

    expect(call[0]).toBe('/directors/')
    expect(call[1].params).toMatchObject({ search: 'ada', active: true })

    expect(
      await askedNothing(() => directors.useGetDirectors({ enabled: false }), mockApi.get),
    ).toBe(true)
  })

  it('deletes a director', async () => {
    await mutate(() => directors.useDeleteDirector(), 7)

    expect(mockApi.delete).toHaveBeenCalledWith('/directors/7')
  })
})

describe('users', () => {
  it('serializes repeated roles without array indexes', async () => {
    const call = await requestOf(
      () => users.useGetUsers({ search: 'ada', active: true, roles: ['ADMIN', 'DOCENTE'] }),
      mockApi.get,
    )

    expect(call[0]).toBe('/users/')
    expect(call[1].params).toMatchObject({ roles: ['ADMIN', 'DOCENTE'] })
    expect(call[1].paramsSerializer).toEqual({ indexes: null })
  })

  it('leaves an empty role list out of the query', async () => {
    const call = await requestOf(() => users.useGetUsers({ roles: [] }), mockApi.get)

    expect(call[1].params).toEqual({ page: 1, limit: 10 })
  })

  it('creates and updates a user', async () => {
    await mutate(() => users.useCreateUser(), { email: 'ada@ufps.edu.co' } as never)
    expect(mockApi.post).toHaveBeenCalledWith('/users/', { email: 'ada@ufps.edu.co' })

    await mutate(() => users.useUpdateUser(), {
      userId: 7,
      payload: { active: false } as never,
    })
    expect(mockApi.put).toHaveBeenCalledWith('/users/7', { active: false })
  })
})

describe('comments', () => {
  it('sends only the filters the panel has on', async () => {
    const bare = await requestOf(() => comments.useGetComments(), mockApi.get)

    expect(bare[0]).toBe('/comments/')
    expect(bare[1].params).toEqual({ page: 1, limit: 10 })

    const filtered = await requestOf(
      () =>
        comments.useGetComments({
          academicPeriodId: 4,
          teacherId: 11,
          riskLevel: 3,
          pedagogicalCategoryId: 2,
          search: 'aula',
          modality: 'DISTANCIA',
        }),
      mockApi.get,
    )

    expect(filtered[1].params).toMatchObject({
      academic_period_id: 4,
      teacher_id: 11,
      risk_level: 3,
      pedagogical_category_id: 2,
      search: 'aula',
      modality: 'DISTANCIA',
    })
  })

  it('can be held back, and fetches one comment once picked', async () => {
    expect(await askedNothing(() => comments.useGetComments({ enabled: false }), mockApi.get)).toBe(
      true,
    )
    expect(await askedNothing(() => comments.useGetComment(undefined), mockApi.get)).toBe(true)

    const one = await requestOf(() => comments.useGetComment(77), mockApi.get)

    expect(one[0]).toBe('/comments/77')
  })
})

describe('notifications', () => {
  it('builds the query string by hand, keeping `read=false`', async () => {
    const call = await requestOf(
      () =>
        notifications.useGetMyNotifications({
          page: 2,
          limit: 5,
          filters: { type: 'warning', read: false, search: 'acta' },
        }),
      mockApi.get,
    )

    expect(call[0]).toBe('/notifications/me?type=warning&read=false&search=acta&page=2&limit=5')
  })

  it('sends just the paging when no filter is set', async () => {
    const call = await requestOf(() => notifications.useGetMyNotifications(), mockApi.get)

    expect(call[0]).toBe('/notifications/me?page=1&limit=10')
  })

  it('marks one and all as read', async () => {
    await notifications.markAsReadApi({ notification_ids: [1, 2] } as never)
    expect(mockApi.put).toHaveBeenCalledWith('/notifications/me/read', {
      notification_ids: [1, 2],
    })

    await notifications.markAllAsReadApi()
    expect(mockApi.put).toHaveBeenCalledWith('/notifications/me/read-all')
  })

  it('reads the unread badge count', async () => {
    await notifications.getUnreadCount()

    expect(mockApi.get).toHaveBeenCalledWith('/notifications/me/unread-count')
  })
})

describe('academic periods', () => {
  it('asks for the whole catalogue in one page, for the selectors', async () => {
    const call = await requestOf(() => periods.useGetAcademicPeriods(), mockApi.get)

    expect(call[0]).toBe('/academic-periods')
    expect(call[1]).toMatchObject({ params: { limit: 100 } })
  })

  it('pages the admin list separately, with its own filters', async () => {
    const call = await requestOf(
      () => periods.useGetAcademicPeriodsAdmin({ search: '2028', active: true }),
      mockApi.get,
    )

    expect(call[0]).toBe('/academic-periods/')
    expect(call[1].params).toMatchObject({ search: '2028', active: true })
  })

  it('creates, updates and deletes a period', async () => {
    await mutate(() => periods.useCreateAcademicPeriod(), { name: '2028-1' } as never)
    expect(mockApi.post).toHaveBeenCalledWith('/academic-periods/', { name: '2028-1' })

    await mutate(() => periods.useUpdateAcademicPeriod(), {
      periodId: 4,
      payload: { name: '2028-I' } as never,
    })
    expect(mockApi.put).toHaveBeenCalledWith('/academic-periods/4', { name: '2028-I' })

    await mutate(() => periods.useDeleteAcademicPeriod(), 4)
    expect(mockApi.delete).toHaveBeenCalledWith('/academic-periods/4')
  })
})

describe('useGetTeacherHistory', () => {
  it('reshapes the backend envelope into the pagination the table expects', async () => {
    mockApi.get.mockResolvedValue({
      data: { items: [{ id: 1 }], total: 42, page: 2, pages: 5, limit: 10 },
    })

    const { result } = renderApiHook(() => periods.useGetTeacherHistory({ page: 2 }))

    await settled(result)

    expect(mockApi.get).toHaveBeenCalledWith('/teachers/11/history', {
      params: { page: 2, limit: 10 },
    })
    expect(result.current.data?.data).toEqual([{ id: 1 }])
    expect(result.current.data?.pagination).toEqual({ total: 42, page: 2, pages: 5, limit: 10 })
  })

  it('sends search and sort only when the table set them', async () => {
    mockApi.get.mockResolvedValue({ data: { items: [], total: 0, page: 1, pages: 0, limit: 10 } })

    await requestOf(
      () => periods.useGetTeacherHistory({ search: 'cálculo', sort_by: 'overall_average_desc' }),
      mockApi.get,
    )

    expect(mockApi.get.mock.calls[0][1]).toMatchObject({
      params: { search: 'cálculo', sort_by: 'overall_average_desc' },
    })
  })

  it('asks nothing for a signed-in user who is not a teacher', async () => {
    authUser.current = { department_id: 3, teacher_id: 0 }

    expect(await askedNothing(() => periods.useGetTeacherHistory(), mockApi.get)).toBe(true)
  })
})
