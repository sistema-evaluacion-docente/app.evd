import { describe, expect, it } from 'vitest'

import { isRiskyLevel, parseRiskLevelId, riskLevelName } from '@/lib/riskLevel'

describe('parseRiskLevelId', () => {
  it('reads a known risk level id off a query string', () => {
    expect(parseRiskLevelId('3')).toBe(3)
    expect(parseRiskLevelId(2)).toBe(2)
  })

  it('drops anything that is not a real risk level id', () => {
    expect(parseRiskLevelId('9')).toBeUndefined()
    expect(parseRiskLevelId('abc')).toBeUndefined()
  })

  it('treats null, undefined and "" as absent', () => {
    expect(parseRiskLevelId(null)).toBeUndefined()
    expect(parseRiskLevelId(undefined)).toBeUndefined()
    expect(parseRiskLevelId('')).toBeUndefined()
  })
})

describe('isRiskyLevel', () => {
  it('trusts the name first, whatever its casing', () => {
    expect(isRiskyLevel({ name: 'medio' })).toBe(true)
    expect(isRiskyLevel({ name: 'ALTO' })).toBe(true)
    expect(isRiskyLevel({ name: 'Bajo' })).toBe(false)
  })

  it('falls back to the id when there is no name', () => {
    expect(isRiskyLevel({ id: 1 })).toBe(false)
    expect(isRiskyLevel({ id: 2 })).toBe(true)
    expect(isRiskyLevel({ id: 3 })).toBe(true)
  })

  it('treats a missing level as not risky', () => {
    expect(isRiskyLevel(null)).toBe(false)
    expect(isRiskyLevel(undefined)).toBe(false)
    expect(isRiskyLevel({})).toBe(false)
  })
})

describe('riskLevelName', () => {
  it('resolves a known id to its name', () => {
    expect(riskLevelName(1)).toBe('Bajo')
    expect(riskLevelName(3)).toBe('Alto')
  })

  it('returns undefined for an unknown or missing id', () => {
    expect(riskLevelName(9)).toBeUndefined()
    expect(riskLevelName(undefined)).toBeUndefined()
  })
})
