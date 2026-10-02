import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useEvaluationAnalysis, useGetEvaluations } from '@/features/evaluations'
import { usePeriodCommentsAnalysis } from '@/features/stats/hooks/usePeriodCommentsAnalysis'

// Both features are mocked wholesale: the real modules pull in the axios
// instance and, with it, the auth store.
vi.mock('@/features/evaluations', () => ({
  evaluationsKeys: { lists: () => ['evaluations', 'list'] },
  useEvaluationAnalysis: vi.fn(),
  useGetEvaluations: vi.fn(),
}))

vi.mock('@/features/stats/api', () => ({ statsKeys: { all: ['stats'] } }))

const analyze = vi.fn()

function mockAnalysis(isAnalyzing: boolean) {
  vi.mocked(useEvaluationAnalysis).mockReturnValue({ isAnalyzing, analyze })
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

    mockAnalysis(false)

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

  it('hands the run of that evaluation over, with the stats to refresh once it ends', () => {
    const { result } = setup(7)

    expect(useEvaluationAnalysis).toHaveBeenLastCalledWith(
      { id: 12, ai_status: 'PENDING' },
      { queryKeysToInvalidate: [['stats'], ['evaluations', 'list']] },
    )
    expect(result.current.analyze).toBe(analyze)
  })

  it('says it is analyzing whenever the run says so', () => {
    mockAnalysis(true)

    const { result } = setup(7)

    expect(result.current.isAnalyzing).toBe(true)
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
