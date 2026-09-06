import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import { act } from 'react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnalyzeEvaluation, useEvaluationLogs, useGetEvaluations } from '@/features/evaluations'
import { usePeriodCommentsAnalysis } from '@/features/stats/hooks/usePeriodCommentsAnalysis'

// Both features are mocked wholesale: the real modules pull in the axios
// instance and, with it, the auth store.
vi.mock('@/features/evaluations', () => ({
  evaluationsKeys: { lists: () => ['evaluations', 'list'] },
  useAnalyzeEvaluation: vi.fn(),
  useEvaluationLogs: vi.fn(),
  useGetEvaluations: vi.fn(),
}))

vi.mock('@/features/stats/api', () => ({ statsKeys: { all: ['stats'] } }))

const analyze = vi.fn()
const connect = vi.fn()

function mockMutation(state: { isPending: boolean; isSuccess: boolean }) {
  vi.mocked(useAnalyzeEvaluation).mockReturnValue({
    mutate: analyze,
    ...state,
  } as unknown as ReturnType<typeof useAnalyzeEvaluation>)
}

function mockEvaluation(
  evaluation: { id: number; ai_status: string } | undefined,
  state: { isPending?: boolean; isPlaceholderData?: boolean } = {},
) {
  vi.mocked(useGetEvaluations).mockReturnValue({
    data: { data: evaluation ? [evaluation] : [] },
    isPending: false,
    isPlaceholderData: false,
    ...state,
  } as unknown as ReturnType<typeof useGetEvaluations>)
}

function setup(periodId?: number) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries')

  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }

  const view = renderHook((id: number | undefined = periodId) => usePeriodCommentsAnalysis(id), {
    wrapper,
  })

  return { ...view, invalidate }
}

describe('usePeriodCommentsAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockMutation({ isPending: false, isSuccess: false })

    vi.mocked(useEvaluationLogs).mockReturnValue({
      connect,
    } as unknown as ReturnType<typeof useEvaluationLogs>)

    mockEvaluation({ id: 12, ai_status: 'PENDING' })
  })

  it('asks for the evaluation of one period, scoped to the department', () => {
    setup(7)

    expect(useGetEvaluations).toHaveBeenCalledWith({ period_id: 7, limit: 1, enabled: true })
  })

  it('holds the request back until a period is picked', () => {
    mockEvaluation(undefined, { isPending: true })

    const { result } = setup(undefined)

    expect(useGetEvaluations).toHaveBeenCalledWith({
      period_id: undefined,
      limit: 1,
      enabled: false,
    })
    expect(result.current.aiStatus).toBeNull()
    expect(result.current.isStatusPending).toBe(false)
  })

  it('says the status is unknown while the request is in flight', () => {
    // The counts come from another query and land first: reading this `null` as
    // "nothing to analyze" is what flashed the empty charts on every reload.
    mockEvaluation(undefined, { isPending: true })

    const { result } = setup(7)

    expect(result.current.isStatusPending).toBe(true)
    expect(result.current.aiStatus).toBeNull()
  })

  it('says the same while it is still showing the period picked before', () => {
    mockEvaluation({ id: 12, ai_status: 'ANALYZED' }, { isPlaceholderData: true })

    const { result } = setup(7)

    expect(result.current.isStatusPending).toBe(true)
  })

  it('is done waiting once the status of the period asked for is in', () => {
    const { result } = setup(7)

    expect(result.current.isStatusPending).toBe(false)
    expect(result.current.aiStatus).toBe('PENDING')
  })

  it('starts the analysis on that evaluation, with the log stream watching it', () => {
    const { result } = setup(7)

    act(() => result.current.analyze())

    expect(connect).toHaveBeenCalledWith(
      expect.objectContaining({ evaluationId: 12, detailsUrl: '/evaluaciones/12' }),
    )
    expect(analyze).toHaveBeenCalledWith(12)
  })

  it('keeps saying it is analyzing while the queued run has yet to say so', () => {
    // The 202 lands before the background task marks the row `ANALYZING`, so
    // for one refetch `ai_status` is still `PENDING`.
    mockMutation({ isPending: false, isSuccess: true })

    const { result } = setup(7)

    expect(result.current.isAnalyzing).toBe(true)
  })

  it('stops once the row reaches a verdict of its own', () => {
    mockMutation({ isPending: false, isSuccess: true })
    mockEvaluation({ id: 12, ai_status: 'ANALYZED' })

    const { result } = setup(7)

    expect(result.current.isAnalyzing).toBe(false)
  })

  it('does nothing when there is no evaluation to analyze', () => {
    mockEvaluation(undefined)

    const { result } = setup(7)

    act(() => result.current.analyze())

    expect(analyze).not.toHaveBeenCalled()
  })

  it('refreshes the department stats when the run finishes', () => {
    // The WebSocket is the fast path; this is what still fires when it never
    // connected and only the `ai_status` poll notices the run ended.
    mockEvaluation({ id: 12, ai_status: 'ANALYZING' })

    const { rerender, invalidate } = setup(7)

    invalidate.mockClear()
    mockEvaluation({ id: 12, ai_status: 'ANALYZED' })
    rerender()

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['stats'] })
  })

  it('leaves an already-analyzed period alone', () => {
    mockEvaluation({ id: 12, ai_status: 'ANALYZED' })

    const { result, invalidate } = setup(7)

    expect(result.current.isAnalyzing).toBe(false)
    expect(invalidate).not.toHaveBeenCalled()
  })
})
