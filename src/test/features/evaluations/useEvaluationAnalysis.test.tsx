import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useAnalyzeEvaluation } from '@/features/evaluations/api'
import type { AiStatus } from '@/features/evaluations/types'
import { useEvaluationAnalysis } from '@/features/evaluations/hooks/useEvaluationAnalysis'
import { useEvaluationLogs } from '@/features/evaluations/hooks/useEvaluationLogs'

// Mocked wholesale: the real modules pull in the axios instance and, with it,
// the auth store.
vi.mock('@/features/evaluations/api', () => ({ useAnalyzeEvaluation: vi.fn() }))
vi.mock('@/features/evaluations/hooks/useEvaluationLogs', () => ({ useEvaluationLogs: vi.fn() }))

const mutate = vi.fn()
const connect = vi.fn()

function mockMutation(isPending: boolean) {
  vi.mocked(useAnalyzeEvaluation).mockReturnValue({
    mutate,
    isPending,
  } as unknown as ReturnType<typeof useAnalyzeEvaluation>)
}

type Row = { id: number; ai_status: AiStatus | null } | undefined

function setup(initial: Row) {
  return renderHook(
    (evaluation: Row) =>
      useEvaluationAnalysis(evaluation, { queryKeysToInvalidate: [['evaluations', 'list']] }),
    { initialProps: initial },
  )
}

describe('useEvaluationAnalysis', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockMutation(false)

    vi.mocked(useEvaluationLogs).mockReturnValue({
      connect,
    } as unknown as ReturnType<typeof useEvaluationLogs>)
  })

  it('starts the analysis on that evaluation, with the log stream watching it', () => {
    const { result } = setup({ id: 12, ai_status: 'PENDING' })

    act(() => result.current.analyze())

    expect(connect).toHaveBeenCalledWith({
      evaluationId: 12,
      queryKeysToInvalidate: [['evaluations', 'list']],
      detailsUrl: '/evaluaciones/12',
    })
    expect(mutate).toHaveBeenCalledWith(12, expect.anything())
  })

  it('says it is analyzing while the request is in flight', () => {
    mockMutation(true)

    const { result } = setup({ id: 12, ai_status: 'PENDING' })

    expect(result.current.isAnalyzing).toBe(true)
  })

  it('keeps saying it is analyzing while the queued run has yet to say so', () => {
    // The 202 lands before the background task marks the row `ANALYZING`, so
    // for a refetch or two `ai_status` is still `PENDING`.
    const { result, rerender } = setup({ id: 12, ai_status: 'PENDING' })

    act(() => result.current.analyze())
    rerender({ id: 12, ai_status: 'PENDING' })

    expect(result.current.isAnalyzing).toBe(true)
  })

  it('does not read a previous failure as the verdict of the run just asked for', () => {
    const { result, rerender } = setup({ id: 12, ai_status: 'FAILED' })

    act(() => result.current.analyze())
    rerender({ id: 12, ai_status: 'FAILED' })

    expect(result.current.isAnalyzing).toBe(true)
  })

  it('stops once the row reaches a verdict of its own', () => {
    const { result, rerender } = setup({ id: 12, ai_status: 'PENDING' })

    act(() => result.current.analyze())

    rerender({ id: 12, ai_status: 'ANALYZING' })
    expect(result.current.isAnalyzing).toBe(true)

    rerender({ id: 12, ai_status: 'ANALYZED' })
    expect(result.current.isAnalyzing).toBe(false)
  })

  it('queues a single run on a double click', () => {
    const { result } = setup({ id: 12, ai_status: 'PENDING' })

    act(() => result.current.analyze())
    act(() => result.current.analyze())

    expect(mutate).toHaveBeenCalledOnce()
  })

  it('refuses a run while the row already says one is going', () => {
    const { result } = setup({ id: 12, ai_status: 'ANALYZING' })

    act(() => result.current.analyze())

    expect(mutate).not.toHaveBeenCalled()
  })

  it('frees the run again when the request fails', () => {
    mutate.mockImplementationOnce((_id: number, options: { onError: () => void }) =>
      options.onError(),
    )

    const { result } = setup({ id: 12, ai_status: 'PENDING' })

    act(() => result.current.analyze())

    expect(result.current.isAnalyzing).toBe(false)
  })

  it('forgets the run when another evaluation takes its place', () => {
    const { result, rerender } = setup({ id: 12, ai_status: 'PENDING' })

    act(() => result.current.analyze())
    rerender({ id: 13, ai_status: 'PENDING' })

    expect(result.current.isAnalyzing).toBe(false)
  })

  it('does nothing when there is no evaluation to analyze', () => {
    const { result } = setup(undefined)

    act(() => result.current.analyze())

    expect(mutate).not.toHaveBeenCalled()
    expect(connect).not.toHaveBeenCalled()
  })
})
