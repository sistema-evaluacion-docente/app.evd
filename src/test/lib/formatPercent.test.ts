import { describe, expect, it } from 'vitest'

import { formatPercent, toPercent } from '@/lib/formatPercent'

describe('toPercent', () => {
  it('scales a 0–1 ratio up to a whole percentage', () => {
    expect(toPercent(0.82)).toBe(82)
  })

  it('leaves an already-whole percentage alone', () => {
    expect(toPercent(82)).toBe(82)
  })

  it('clamps out-of-range values to 0–100', () => {
    expect(toPercent(150)).toBe(100)
    expect(toPercent(-5)).toBe(0)
  })

  it('returns null for missing or NaN values', () => {
    expect(toPercent(null)).toBeNull()
    expect(toPercent(undefined)).toBeNull()
    expect(toPercent(NaN)).toBeNull()
  })

  it('treats exactly 1 as a ratio, not a whole percent', () => {
    expect(toPercent(1)).toBe(100)
  })
})

describe('formatPercent', () => {
  it('formats a score as a percentage string', () => {
    expect(formatPercent(0.5)).toBe('50%')
  })

  it('shows an em dash for a missing value', () => {
    expect(formatPercent(null)).toBe('—')
    expect(formatPercent(undefined)).toBe('—')
  })
})
