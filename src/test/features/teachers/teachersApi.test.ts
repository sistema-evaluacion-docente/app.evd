import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import * as teachersApi from '@/features/teachers/api'
import { teachersKeys } from '@/features/teachers/api'
import { askedNothing, renderApiHook, requestOf } from '@/test/apiHarness'

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn() },
}))

// Both list hooks resolve the department off the signed-in director; the real
// module drags in the Firebase client, so only the store is stood in for.
const authDepartmentId = { current: 3 as number | null }

vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) =>
    selector({ user: { department_id: authDepartmentId.current } }),
}))

const mockApi = vi.mocked(api)

beforeEach(() => {
  vi.clearAllMocks()
  authDepartmentId.current = 3
  mockApi.get.mockResolvedValue({ data: {} })
  mockApi.post.mockResolvedValue({ data: {} })
  mockApi.put.mockResolvedValue({ data: {} })
  mockApi.patch.mockResolvedValue({ data: {} })
})

async function mutate<V>(hook: () => { mutateAsync: (vars: V) => Promise<unknown> }, vars: V) {
  const { result } = renderApiHook(hook)

  await act(async () => {
    await result.current.mutateAsync(vars)
  })
}

describe('teachersKeys', () => {
  it('separates the caches a teacher screen reads from', () => {
    expect(teachersKeys.detail(1, '2028-1')).not.toEqual(teachersKeys.detail(1, '2027-2'))
    expect(teachersKeys.comments(9, 1)).not.toEqual(teachersKeys.comments(9, 2))
    expect(teachersKeys.courseHistory(1, 'IS101', 5)).not.toEqual(
      teachersKeys.courseHistory(1, 'IS101', 10),
    )
    expect(teachersKeys.matrix(1, 9)[0]).toBe('teachers')
  })
})

describe('useGetTeachers', () => {
  it('sends only the filters that were actually set', async () => {
    const call = await requestOf(
      () => teachersApi.useGetTeachers({ academicPeriodId: 4, page: 2, limit: 20 }),
      mockApi.get,
    )

    expect(call[0]).toBe('/teachers/with-averages')
    expect(call[1].params).toEqual({
      page: 2,
      limit: 20,
      academic_period_id: 4,
      department_id: 3,
    })
  })

  it('passes every filter through when the table has them all on', async () => {
    const call = await requestOf(
      () =>
        teachersApi.useGetTeachers({
          academicPeriodId: 4,
          search: 'ada',
          departmentId: 9,
          active: false,
          contractType: 'TIEMPO COMPLETO',
          sortBy: 'average',
          hasAverage: true,
          modality: 'DISTANCIA',
        }),
      mockApi.get,
    )

    expect(call[1].params).toMatchObject({
      search: 'ada',
      department_id: 9,
      active: false,
      contract_type: 'TIEMPO COMPLETO',
      sort_by: 'average',
      has_average: true,
      modality: 'DISTANCIA',
    })
  })

  it('waits for a period rather than listing every teacher ever evaluated', async () => {
    expect(await askedNothing(() => teachersApi.useGetTeachers({}), mockApi.get)).toBe(true)
  })

  it('waits for the department to resolve when the director has none yet', async () => {
    authDepartmentId.current = null

    expect(
      await askedNothing(() => teachersApi.useGetTeachers({ academicPeriodId: 4 }), mockApi.get),
    ).toBe(true)
  })

  it('treats an explicit null department as resolved — that is the admin, unscoped', async () => {
    authDepartmentId.current = null

    const call = await requestOf(
      () => teachersApi.useGetTeachers({ academicPeriodId: 4, departmentId: null }),
      mockApi.get,
    )

    expect(call[1].params).not.toHaveProperty('department_id')
  })
})

describe('useListTeachers', () => {
  it('lists the plain directory scoped to the director’s department', async () => {
    const call = await requestOf(() => teachersApi.useListTeachers(), mockApi.get)

    expect(call[0]).toBe('/teachers/')
    expect(call[1]).toMatchObject({ params: { page: 1, limit: 10, department_id: 3 } })
  })

  it('holds back until a department is known', async () => {
    authDepartmentId.current = null

    expect(await askedNothing(() => teachersApi.useListTeachers(), mockApi.get)).toBe(true)
  })
})

describe('teacher detail queries', () => {
  it('asks for the detail with the previous period to compare against', async () => {
    const call = await requestOf(
      () => teachersApi.useGetTeacherDetail({ teacherId: 4, periodName: '2028-1' }),
      mockApi.get,
    )

    expect(call[0]).toBe('/evaluations/teachers/4/detail')
    expect(call[1]).toMatchObject({
      params: { period_name: '2028-1', compare_previous: true },
    })
  })

  it('treats a blank period as no period at all', async () => {
    expect(
      await askedNothing(
        () => teachersApi.useGetTeacherDetail({ teacherId: 4, periodName: '' }),
        mockApi.get,
      ),
    ).toBe(true)
  })

  it('fetches the comments of a teacher within one evaluation', async () => {
    const call = await requestOf(
      () => teachersApi.useGetTeacherComments({ evaluationId: 9, teacherId: 4 }),
      mockApi.get,
    )

    expect(call[0]).toBe('/evaluations/9/teachers/4/comments')

    expect(
      await askedNothing(() => teachersApi.useGetTeacherComments({ teacherId: 4 }), mockApi.get),
    ).toBe(true)
  })

  it('escapes the course code, which carries characters a URL would eat', async () => {
    const call = await requestOf(
      () =>
        teachersApi.useGetTeacherCourseHistory({ teacherId: 4, courseCode: 'IS 101/A', limit: 5 }),
      mockApi.get,
    )

    expect(call[0]).toBe('/teachers/4/courses/IS%20101%2FA/history')
    expect(call[1]).toMatchObject({ params: { limit: 5 } })
  })

  it('does not ask for the history of teacher zero', async () => {
    expect(
      await askedNothing(
        () => teachersApi.useGetTeacherCourseHistory({ teacherId: 0, courseCode: 'IS101' }),
        mockApi.get,
      ),
    ).toBe(true)
  })

  it('fetches the per-dimension matrix from stats', async () => {
    const call = await requestOf(
      () => teachersApi.useGetTeacherMatrix({ teacherId: 4, evaluationId: 9 }),
      mockApi.get,
    )

    expect(call[0]).toBe('/stats/teachers/4/matrix')
    expect(call[1]).toMatchObject({ params: { evaluation_id: 9 } })

    expect(
      await askedNothing(() => teachersApi.useGetTeacherMatrix({ teacherId: 4 }), mockApi.get),
    ).toBe(true)
  })
})

describe('mutations', () => {
  it('uploads the teacher spreadsheet as multipart', async () => {
    const file = new File(['x'], 'docentes.xlsx')

    await mutate(() => teachersApi.useUploadTeachers(), file)

    const [url, body, config] = mockApi.post.mock.calls[0]

    expect(url).toBe('/teachers/upload')
    expect((body as FormData).get('file')).toBe(file)
    expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } })
  })

  it('creates a teacher together with their account', async () => {
    const payload = {
      email: 'ada@ufps.edu.co',
      name: 'Ada Lovelace',
      institutional_code: 'A1',
      department_id: 3,
      contract_type: 'TIEMPO COMPLETO',
      active: true,
    }

    await mutate(() => teachersApi.useCreateTeacherWithUser(), payload)

    expect(mockApi.post).toHaveBeenCalledWith('/teachers/with-user', payload)
  })

  it('updates a teacher', async () => {
    await mutate(() => teachersApi.useUpdateTeacher(), {
      teacherId: 4,
      payload: { name: 'Ada L.' } as never,
    })

    expect(mockApi.put).toHaveBeenCalledWith('/teachers/4', { name: 'Ada L.' })
  })

  it('re-tags a comment through the flat comments endpoint', async () => {
    await mutate(() => teachersApi.useUpdateComment(), {
      commentId: 77,
      payload: { risk_level: 2, pedagogical_category_ids: [1, 4] },
    })

    expect(mockApi.patch).toHaveBeenCalledWith('/comments/77', {
      risk_level: 2,
      pedagogical_category_ids: [1, 4],
    })
  })

  it('hands back an object URL for the evaluation report', async () => {
    mockApi.get.mockResolvedValue(new Blob(['pdf']))

    const { result } = renderApiHook(() => teachersApi.useDownloadTeacherEvaluationReport())

    let url = ''
    await act(async () => {
      url = (await result.current.mutateAsync({ teacherId: 4, evaluationId: 9 })) as string
    })

    expect(mockApi.get).toHaveBeenCalledWith('/teachers/4/evaluations/9/report', {
      responseType: 'blob',
    })
    expect(url).toMatch(/^blob:/)
  })
})
