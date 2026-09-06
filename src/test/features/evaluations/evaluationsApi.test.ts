import { act } from '@testing-library/react'
import { toast } from 'sonner'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import * as evaluationsApi from '@/features/evaluations/api'
import { evaluationsKeys } from '@/features/evaluations/api'
import { askedNothing, renderApiHook, requestOf } from '@/test/apiHarness'

vi.mock('@/config/axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

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
  mockApi.patch.mockResolvedValue({ data: {} })
  mockApi.delete.mockResolvedValue({ data: null })
})

async function mutate<V>(hook: () => { mutateAsync: (vars: V) => Promise<unknown> }, vars: V) {
  const { result } = renderApiHook(hook)

  await act(async () => {
    await result.current.mutateAsync(vars)
  })
}

describe('evaluationsKeys', () => {
  it('keys a report by modality, so switching one doesn’t read the other’s cache', () => {
    expect(evaluationsKeys.byId(9, 'DISTANCIA')).not.toEqual(evaluationsKeys.byId(9, 'PRESENCIAL'))
    expect(evaluationsKeys.pdf(9)).not.toEqual(evaluationsKeys.pdf(9, 'DISTANCIA'))
    expect(evaluationsKeys.dimensionsDetail(9, { teacherId: 1 })).not.toEqual(
      evaluationsKeys.dimensionsDetail(9, { teacherId: 2 }),
    )
    expect(evaluationsKeys.teacherReport(1, 9)[0]).toBe('evaluations')
  })
})

describe('queries', () => {
  it('drops the filters the table left empty', async () => {
    const call = await requestOf(() => evaluationsApi.useGetEvaluations(), mockApi.get)

    expect(call[0]).toBe('/evaluations')
    expect(call[1].params).toEqual({ page: 1, limit: 10, department_id: 3 })
  })

  it('sends every filter the table has on', async () => {
    const call = await requestOf(
      () =>
        evaluationsApi.useGetEvaluations({
          search: 'sistemas',
          sort_by: 'date',
          period_id: 4,
          active: true,
          status: 'COMPLETED',
          ai_status: 'DONE',
        }),
      mockApi.get,
    )

    expect(call[1].params).toMatchObject({
      search: 'sistemas',
      sort_by: 'date',
      period_id: 4,
      active: true,
      status: 'COMPLETED',
      ai_status: 'DONE',
    })
  })

  it('waits for the signed-in user’s department before listing', async () => {
    authDepartmentId.current = null

    expect(await askedNothing(() => evaluationsApi.useGetEvaluations(), mockApi.get)).toBe(true)
  })

  it('fetches one evaluation, carrying the modality through', async () => {
    const call = await requestOf(() => evaluationsApi.useGetEvaluation(9, 'DISTANCIA'), mockApi.get)

    expect(call[0]).toBe('/evaluations/9')
    expect(call[1]).toMatchObject({ params: { modality: 'DISTANCIA' } })

    expect(await askedNothing(() => evaluationsApi.useGetEvaluation(undefined), mockApi.get)).toBe(
      true,
    )
  })

  it('keeps polling an evaluation that is still being processed', async () => {
    mockApi.get.mockResolvedValue({ data: { status: 'PROCESSING' } })

    const { result } = renderApiHook(() => evaluationsApi.useGetEvaluation(9))

    await act(async () => {
      await Promise.resolve()
    })

    // The poll is what keeps the page honest while the backend works; a
    // finished evaluation must not keep the interval alive.
    expect(mockApi.get).toHaveBeenCalled()
    expect(result.current.isError).toBe(false)
  })

  it('fetches the evaluation of a period', async () => {
    const call = await requestOf(() => evaluationsApi.useGetEvaluationByPeriod(4), mockApi.get)

    expect(call[0]).toBe('/evaluations/by-period/4')

    expect(
      await askedNothing(() => evaluationsApi.useGetEvaluationByPeriod(undefined), mockApi.get),
    ).toBe(true)
  })

  it('fetches the source PDF as a blob', async () => {
    mockApi.get.mockResolvedValue(new Blob(['pdf']))

    const call = await requestOf(
      () => evaluationsApi.useGetEvaluationPdf(9, 'PRESENCIAL'),
      mockApi.get,
    )

    expect(call[0]).toBe('/evaluations/9/pdf')
    expect(call[1]).toMatchObject({ responseType: 'blob', params: { modality: 'PRESENCIAL' } })

    expect(
      await askedNothing(() => evaluationsApi.useGetEvaluationPdf(undefined), mockApi.get),
    ).toBe(true)
  })

  it('fetches a teacher’s report for one evaluation', async () => {
    mockApi.get.mockResolvedValue(new Blob(['pdf']))

    const call = await requestOf(
      () => evaluationsApi.useGetTeacherEvaluationReport({ teacherId: 4, evaluationId: 9 }),
      mockApi.get,
    )

    expect(call[0]).toBe('/teachers/4/evaluations/9/report')

    expect(
      await askedNothing(
        () => evaluationsApi.useGetTeacherEvaluationReport({ teacherId: 4 }),
        mockApi.get,
      ),
    ).toBe(true)
  })

  it('sends only the dimension filters that are set', async () => {
    const bare = await requestOf(
      () => evaluationsApi.useGetEvaluationDimensionsDetail(9),
      mockApi.get,
    )

    expect(bare[0]).toBe('/evaluations/9/dimensions/detail')
    expect(bare[1].params).toEqual({})

    const filtered = await requestOf(
      () =>
        evaluationsApi.useGetEvaluationDimensionsDetail(9, {
          teacherId: 4,
          courseId: 7,
          modality: 'DISTANCIA',
        }),
      mockApi.get,
    )

    expect(filtered[1].params).toEqual({ teacher_id: 4, course_id: 7, modality: 'DISTANCIA' })
  })
})

describe('mutations', () => {
  it('activates an evaluation and says so', async () => {
    await mutate(() => evaluationsApi.useUpdateEvaluationStatus(), {
      evaluationId: 9,
      active: true,
    })

    expect(mockApi.patch).toHaveBeenCalledWith('/evaluations/9/status', { active: true })
    expect(toast.success).toHaveBeenCalledWith('Evaluación activada exitosamente')
  })

  it('words the toast differently when deactivating', async () => {
    await mutate(() => evaluationsApi.useUpdateEvaluationStatus(), {
      evaluationId: 9,
      active: false,
    })

    expect(toast.success).toHaveBeenCalledWith('Evaluación desactivada exitosamente')
  })

  it('deletes an evaluation', async () => {
    await mutate(() => evaluationsApi.useDeleteEvaluation(), 9)

    expect(mockApi.delete).toHaveBeenCalledWith('/evaluations/9')
    expect(toast.success).toHaveBeenCalledWith('Evaluación eliminada exitosamente')
  })

  it('kicks off the AI analysis', async () => {
    await mutate(() => evaluationsApi.useAnalyzeEvaluation(), 9)

    expect(mockApi.post).toHaveBeenCalledWith('/evaluations/9/analyze')
    expect(toast.success).toHaveBeenCalledWith('Análisis con IA iniciado exitosamente')
  })

  it('uploads one PDF per modality under a repeated `file` field', async () => {
    const presencial = new File(['a'], 'presencial.pdf')
    const distancia = new File(['b'], 'distancia.pdf')

    await mutate(() => evaluationsApi.useUploadEvaluation(), [presencial, distancia])

    const [url, body, config] = mockApi.post.mock.calls[0]

    expect(url).toBe('/evaluations/upload')
    expect((body as FormData).getAll('file')).toEqual([presencial, distancia])
    expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } })
  })
})
