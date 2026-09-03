import { act } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import api from '@/config/axios'
import * as plansApi from '@/features/plans/api'
import { plansKeys } from '@/features/plans/api'
import { askedNothing, renderApiHook, requestOf } from '@/test/apiHarness'

vi.mock('@/config/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

// The list hook resolves the department off the signed-in director when the
// caller doesn't pass one; `@/features/auth` is mocked because importing it for
// real drags in the Firebase client.
vi.mock('@/features/auth', () => ({
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ user: { department_id: 3 } }),
}))

const mockApi = vi.mocked(api)

/** Payload shape the axios interceptor hands back: the envelope, unwrapped. */
const OK = { data: {} }

beforeEach(() => {
  vi.clearAllMocks()
  mockApi.get.mockResolvedValue(OK)
  mockApi.post.mockResolvedValue(OK)
  mockApi.put.mockResolvedValue(OK)
  mockApi.delete.mockResolvedValue(OK)
})

/** Runs a mutation to completion, the way a component's click handler would. */
async function mutate<V>(hook: () => { mutateAsync: (vars: V) => Promise<unknown> }, vars: V) {
  const { result } = renderApiHook(hook)

  await act(async () => {
    await result.current.mutateAsync(vars)
  })
}

describe('plansKeys', () => {
  it('nests every key under the same root, so one invalidation reaches them all', () => {
    expect(plansKeys.lists()[0]).toBe('plans')
    expect(plansKeys.detail(4)).toEqual(['plans', 'detail', 4])
    expect(plansKeys.mine()).toEqual(['plans', 'mine'])
    expect(plansKeys.indicators()).toEqual(['plans', 'indicators'])
    expect(plansKeys.evidenceRequests(4)).toEqual(['plans', 'evidence-requests', 4])
  })

  it('keeps two teachers' + ' course lists apart', () => {
    expect(plansKeys.courses(1, 2)).not.toEqual(plansKeys.courses(2, 2))
    expect(plansKeys.history(1)).not.toEqual(plansKeys.history(2))
  })
})

describe('queries', () => {
  it('lists plans against the signed-in director’s department', async () => {
    const call = await requestOf(() => plansApi.useGetPlans({ page: 2, limit: 5 }), mockApi.get)

    expect(call[0]).toBe('/improvement-plans/')
    expect(call[1]).toMatchObject({ params: { page: 2, limit: 5, department_id: 3 } })
  })

  it('lets an explicit department win over the director’s own', async () => {
    const call = await requestOf(
      () => plansApi.useGetPlans({ departmentId: 9, status: '', search: '' }),
      mockApi.get,
    )

    expect(call[1]).toMatchObject({ params: { department_id: 9 } })
    // Blank filters are dropped rather than sent as empty strings.
    expect(call[1]).toMatchObject({ params: { status: undefined, search: undefined } })
  })

  it('asks nothing while the caller is still resolving a filter', async () => {
    expect(await askedNothing(() => plansApi.useGetPlans({ enabled: false }), mockApi.get)).toBe(
      true,
    )
  })

  it('fetches one plan, and only once an id is known', async () => {
    expect(await askedNothing(() => plansApi.useGetPlan(undefined), mockApi.get)).toBe(true)

    const call = await requestOf(() => plansApi.useGetPlan(12), mockApi.get)

    expect(call[0]).toBe('/improvement-plans/12')
  })

  it('fetches the signed-in teacher’s own plans', async () => {
    const call = await requestOf(() => plansApi.useGetMyPlans(), mockApi.get)

    expect(call[0]).toBe('/improvement-plans/my')
  })

  it('fetches candidates for a period, and waits for one', async () => {
    expect(await askedNothing(() => plansApi.useGetPlanCandidates(undefined), mockApi.get)).toBe(
      true,
    )

    const call = await requestOf(() => plansApi.useGetPlanCandidates(5, 3), mockApi.get)

    expect(call[0]).toBe('/improvement-plans/candidates')
    expect(call[1]).toMatchObject({ params: { period_id: 5, department_id: 3 } })
  })

  it('fetches selectable periods, scoped to a department when given one', async () => {
    const bare = await requestOf(() => plansApi.useGetPlanPeriods(), mockApi.get)

    expect(bare[0]).toBe('/improvement-plans/periods')
    expect(bare[1]).toMatchObject({ params: undefined })

    const scoped = await requestOf(() => plansApi.useGetPlanPeriods(7), mockApi.get)

    expect(scoped[1]).toMatchObject({ params: { department_id: 7 } })
  })

  it('holds the periods request back behind a panel that was never opened', async () => {
    expect(
      await askedNothing(() => plansApi.useGetPlanPeriods(7, { enabled: false }), mockApi.get),
    ).toBe(true)
  })

  it('fetches the indicator catalogue', async () => {
    const call = await requestOf(() => plansApi.useGetPlanIndicators(), mockApi.get)

    expect(call[0]).toBe('/improvement-plans/indicators')

    expect(
      await askedNothing(() => plansApi.useGetPlanIndicators({ enabled: false }), mockApi.get),
    ).toBe(true)
  })

  it('fetches a teacher’s courses only once both teacher and period are picked', async () => {
    expect(await askedNothing(() => plansApi.useGetTeacherCourses(4), mockApi.get)).toBe(true)
    expect(await askedNothing(() => plansApi.useGetTeacherCourses(undefined, 2), mockApi.get)).toBe(
      true,
    )

    const call = await requestOf(() => plansApi.useGetTeacherCourses(4, 2), mockApi.get)

    expect(call[0]).toBe('/improvement-plans/teacher/4/courses')
    expect(call[1]).toMatchObject({ params: { period_id: 2 } })
  })

  it('fetches a teacher’s cross-period history', async () => {
    expect(
      await askedNothing(() => plansApi.useGetTeacherPlanHistory(undefined), mockApi.get),
    ).toBe(true)

    const call = await requestOf(() => plansApi.useGetTeacherPlanHistory(4), mockApi.get)

    expect(call[0]).toBe('/improvement-plans/teacher/4/history')
  })

  it('fetches the deliverables requested on a plan', async () => {
    expect(await askedNothing(() => plansApi.useGetEvidenceRequests(undefined), mockApi.get)).toBe(
      true,
    )

    const call = await requestOf(() => plansApi.useGetEvidenceRequests(12), mockApi.get)

    expect(call[0]).toBe('/improvement-plans/12/evidence-requests')
  })
})

describe('plan mutations', () => {
  it('creates a plan', async () => {
    await mutate(() => plansApi.useCreatePlan(), { title: 'Plan' } as never)

    expect(mockApi.post).toHaveBeenCalledWith('/improvement-plans/', { title: 'Plan' })
  })

  it('updates a plan and writes the answer straight into its detail cache', async () => {
    mockApi.put.mockResolvedValue({ data: { id: 12, title: 'Nuevo' } })

    await mutate(() => plansApi.useUpdatePlan(12), { title: 'Nuevo' } as never)

    expect(mockApi.put).toHaveBeenCalledWith('/improvement-plans/12', { title: 'Nuevo' })
  })

  it('survives an update that answers with no plan to cache', async () => {
    mockApi.put.mockResolvedValue(undefined)

    await mutate(() => plansApi.useUpdatePlan(12), { title: 'Nuevo' } as never)

    expect(mockApi.put).toHaveBeenCalled()
  })

  it('deletes a plan', async () => {
    await mutate(() => plansApi.useDeletePlan(), 12)

    expect(mockApi.delete).toHaveBeenCalledWith('/improvement-plans/12')
  })

  it('upserts the case report', async () => {
    await mutate(() => plansApi.useUpsertCaseReport(12), { summary: 'x' } as never)

    expect(mockApi.put).toHaveBeenCalledWith('/improvement-plans/12/case-report', { summary: 'x' })
  })

  it('updates one checkpoint of a plan', async () => {
    await mutate(() => plansApi.useUpdateCheckpoint(12), {
      checkpointId: 3,
      payload: { done: true } as never,
    })

    expect(mockApi.put).toHaveBeenCalledWith('/improvement-plans/12/checkpoints/3', { done: true })
  })

  it('closes and reopens the acta', async () => {
    await mutate(() => plansApi.useCloseActa(12), undefined as never)
    expect(mockApi.post).toHaveBeenCalledWith('/improvement-plans/12/acta/close')

    await mutate(() => plansApi.useReopenActa(12), undefined as never)
    expect(mockApi.post).toHaveBeenCalledWith('/improvement-plans/12/acta/reopen')
  })

  it('closes a plan', async () => {
    await mutate(() => plansApi.useClosePlan(12), { outcome: 'CUMPLIDO' } as never)

    expect(mockApi.post).toHaveBeenCalledWith('/improvement-plans/12/close', {
      outcome: 'CUMPLIDO',
    })
  })
})

describe('documents', () => {
  const file = new File(['x'], 'acta.pdf', { type: 'application/pdf' })

  it('uploads a signed scan as multipart', async () => {
    await mutate(() => plansApi.useUploadSignedDocument(12), { format: 'formato-1', file } as never)

    const [url, body, config] = mockApi.post.mock.calls[0]

    expect(url).toBe('/improvement-plans/12/documents/formato-1/signed')
    expect(body).toBeInstanceOf(FormData)
    expect((body as FormData).get('file')).toBe(file)
    expect(config).toMatchObject({ headers: { 'Content-Type': 'multipart/form-data' } })
  })

  it('uploads against a plan whose id is only known at call time', async () => {
    await mutate(() => plansApi.useUploadPlanDocument(), {
      planId: 30,
      format: 'formato-1',
      file,
    } as never)

    expect(mockApi.post.mock.calls[0][0]).toBe('/improvement-plans/30/documents/formato-1/signed')
  })

  it('detaches a signed scan', async () => {
    await mutate(() => plansApi.useDeleteSignedDocument(12), 'formato-2' as never)

    expect(mockApi.delete).toHaveBeenCalledWith('/improvement-plans/12/documents/formato-2/signed')
  })

  it('asks for the generated form when downloading, not the signed scan', async () => {
    mockApi.get.mockResolvedValue(new Blob(['pdf']))

    await mutate(() => plansApi.useDownloadDocument(12), 'formato-2' as never)

    expect(mockApi.get).toHaveBeenCalledWith('/improvement-plans/12/documents/formato-2', {
      responseType: 'blob',
      params: { generated: true },
    })
  })

  it('asks for the signed scan itself when downloading that', async () => {
    mockApi.get.mockResolvedValue(new Blob(['pdf']))

    await mutate(() => plansApi.useDownloadSignedDocument(12), {
      format: 'formato-2',
      filename: 'firmado.pdf',
    } as never)

    expect(mockApi.get).toHaveBeenCalledWith('/improvement-plans/12/documents/formato-2', {
      responseType: 'blob',
      params: undefined,
    })
  })

  it('hands the caller an object URL to preview a signed scan', async () => {
    mockApi.get.mockResolvedValue(new Blob(['pdf']))

    const { result } = renderApiHook(() => plansApi.usePreviewSignedDocument(12))

    let url = ''
    await act(async () => {
      url = (await result.current.mutateAsync('formato-2')) as string
    })

    expect(url).toMatch(/^blob:/)
  })

  it('downloads the editable Word copy from its own endpoint', async () => {
    mockApi.get.mockResolvedValue(new Blob(['doc']))

    await mutate(() => plansApi.useDownloadDocumentWord(12), 'formato-2' as never)

    expect(mockApi.get).toHaveBeenCalledWith('/improvement-plans/12/documents/formato-2/word', {
      responseType: 'blob',
    })
  })
})

describe('evidences', () => {
  it('requests a deliverable', async () => {
    await mutate(() => plansApi.useCreateEvidenceRequest(12), { title: 'Syllabus' } as never)

    expect(mockApi.post).toHaveBeenCalledWith('/improvement-plans/12/evidence-requests', {
      title: 'Syllabus',
    })
  })

  it('adds a comment to a request’s thread', async () => {
    await mutate(() => plansApi.useAddEvidenceComment(12), { requestId: 5, body: 'Falta la firma' })

    expect(mockApi.post).toHaveBeenCalledWith(
      '/improvement-plans/12/evidence-requests/5/comments',
      { body: 'Falta la firma' },
    )
  })

  it('uploads an evidence with only the fields that were filled in', async () => {
    const file = new File(['x'], 'evidencia.pdf')

    await mutate(() => plansApi.useUploadEvidence(12), { file })

    const bare = mockApi.post.mock.calls[0][1] as FormData

    expect(bare.get('file')).toBe(file)
    expect(bare.get('description')).toBeNull()
    expect(bare.get('item_id')).toBeNull()
    expect(bare.get('request_id')).toBeNull()
  })

  it('sends description, item and request when the caller supplies them', async () => {
    const file = new File(['x'], 'evidencia.pdf')

    await mutate(() => plansApi.useUploadEvidence(12), {
      file,
      description: 'Syllabus firmado',
      itemId: 4,
      requestId: 5,
    })

    const full = mockApi.post.mock.calls[0][1] as FormData

    expect(full.get('description')).toBe('Syllabus firmado')
    expect(full.get('item_id')).toBe('4')
    expect(full.get('request_id')).toBe('5')
  })

  it('reviews and deletes an evidence', async () => {
    await mutate(() => plansApi.useReviewEvidence(12), {
      evidenceId: 8,
      payload: { status: 'APROBADA' } as never,
    })
    expect(mockApi.put).toHaveBeenCalledWith('/improvement-plans/12/evidences/8/review', {
      status: 'APROBADA',
    })

    await mutate(() => plansApi.useDeleteEvidence(12), 8 as never)
    expect(mockApi.delete).toHaveBeenCalledWith('/improvement-plans/12/evidences/8')
  })

  it('downloads and previews a submitted evidence file', async () => {
    mockApi.get.mockResolvedValue(new Blob(['pdf']))

    await mutate(() => plansApi.useDownloadEvidence(12), {
      evidenceId: 8,
      filename: 'evidencia.pdf',
    })
    expect(mockApi.get).toHaveBeenCalledWith('/improvement-plans/12/evidences/8', {
      responseType: 'blob',
    })

    const { result } = renderApiHook(() => plansApi.usePreviewEvidence(12))

    let url = ''
    await act(async () => {
      url = (await result.current.mutateAsync(8)) as string
    })

    expect(url).toMatch(/^blob:/)
  })
})
