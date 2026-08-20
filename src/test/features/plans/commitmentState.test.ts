import { describe, expect, it } from 'vitest'

import { commitmentState, countCompleteCommitments } from '@/features/plans/lib/planStatus'

describe('commitmentState', () => {
  it('is complete once the indicator and the commitment are both written', () => {
    expect(
      commitmentState({ description: 'Metodología (3.10)', commitment: 'Tutorías semanales' }),
    ).toBe('complete')
  })

  it('asks for the description first: it is the one the form refuses to save without', () => {
    expect(commitmentState({ description: '   ', commitment: 'Tutorías semanales' })).toBe(
      'missing-description',
    )
  })

  it('flags an empty commitment, which blocks signing the acta later on', () => {
    expect(commitmentState({ description: 'Metodología (3.10)', commitment: '' })).toBe(
      'missing-commitment',
    )
  })

  it('reports the missing description when neither is there, not both at once', () => {
    expect(commitmentState({ description: '', commitment: '' })).toBe('missing-description')
  })

  it('does not take whitespace for an answer', () => {
    expect(commitmentState({ description: 'Puntualidad', commitment: '  \n ' })).toBe(
      'missing-commitment',
    )
  })
})

describe('countCompleteCommitments', () => {
  it('counts only the ones fully filled in', () => {
    expect(
      countCompleteCommitments([
        { description: 'Metodología', commitment: 'Tutorías' },
        { description: 'Puntualidad', commitment: '' },
        { description: '', commitment: 'Algo' },
        { description: 'Material', commitment: 'Guías nuevas' },
      ]),
    ).toBe(2)
  })

  it('is zero with nothing drafted', () => {
    expect(countCompleteCommitments([])).toBe(0)
  })
})
