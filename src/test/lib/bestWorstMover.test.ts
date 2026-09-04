import { describe, expect, it } from 'vitest'

import { findBestWorstMover } from '@/lib/bestWorstMover'

describe('findBestWorstMover', () => {
  it('picks the largest positive and largest negative delta', () => {
    const entries = [
      { item: 'a', delta: 0.2 },
      { item: 'b', delta: -0.5 },
      { item: 'c', delta: 1.1 },
    ]

    const { best, worst } = findBestWorstMover(entries)

    expect(best).toEqual({ item: 'c', delta: 1.1 })
    expect(worst).toEqual({ item: 'b', delta: -0.5 })
  })

  it('returns null for both when there are no entries', () => {
    expect(findBestWorstMover([])).toEqual({ best: null, worst: null })
  })

  it('picks the same single entry as both best and worst', () => {
    const entries = [{ item: 'only', delta: 0.3 }]

    expect(findBestWorstMover(entries)).toEqual({
      best: { item: 'only', delta: 0.3 },
      worst: { item: 'only', delta: 0.3 },
    })
  })
})
