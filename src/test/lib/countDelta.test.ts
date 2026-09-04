import { describe, expect, it } from 'vitest'

import { computeCountDeltas, isRelevantDelta } from '@/lib/countDelta'

describe('computeCountDeltas', () => {
  it('turns counts into shares of the total', () => {
    const deltas = computeCountDeltas([{ value: 5 }, { value: 15 }])

    expect(deltas).toEqual([{ percent: 25 }, { percent: 75 }])
  })

  it('returns 0% for every entry when the total is 0', () => {
    expect(computeCountDeltas([{ value: 0 }, { value: 0 }])).toEqual([
      { percent: 0 },
      { percent: 0 },
    ])
  })

  it('returns an empty array for an empty input', () => {
    expect(computeCountDeltas([])).toEqual([])
  })

  it('adds previousPercent and deltaPoints only when every entry has a previousValue', () => {
    const deltas = computeCountDeltas([
      { value: 5, previousValue: 2 },
      { value: 5, previousValue: 8 },
    ])

    expect(deltas[0].percent).toBe(50)
    expect(deltas[0].previousPercent).toBe(20)
    expect(deltas[0].deltaPoints).toBe(30)
    expect(deltas[1].percent).toBe(50)
    expect(deltas[1].previousPercent).toBe(80)
    expect(deltas[1].deltaPoints).toBe(-30)
  })

  it('skips the delta entirely when only some entries carry a previousValue', () => {
    const deltas = computeCountDeltas([{ value: 5, previousValue: 2 }, { value: 5 }])

    expect(deltas).toEqual([{ percent: 50 }, { percent: 50 }])
  })

  it('skips the delta when the previous total is 0', () => {
    const deltas = computeCountDeltas([
      { value: 5, previousValue: 0 },
      { value: 5, previousValue: 0 },
    ])

    expect(deltas).toEqual([{ percent: 50 }, { percent: 50 }])
  })
})

describe('isRelevantDelta', () => {
  it('treats anything under the noise threshold as not relevant', () => {
    expect(isRelevantDelta(0.4)).toBe(false)
    expect(isRelevantDelta(-0.4)).toBe(false)
    expect(isRelevantDelta(undefined)).toBe(false)
  })

  it('treats the threshold and beyond, either direction, as relevant', () => {
    expect(isRelevantDelta(0.5)).toBe(true)
    expect(isRelevantDelta(-0.5)).toBe(true)
    expect(isRelevantDelta(12)).toBe(true)
  })
})
