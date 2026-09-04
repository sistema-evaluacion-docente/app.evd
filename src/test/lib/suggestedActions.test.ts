import { describe, expect, it } from 'vitest'

import {
  newSuggestedActionId,
  parseSuggestedActions,
  serializeSuggestedActions,
} from '@/features/suggested-actions/lib/suggestedActions'

describe('parseSuggestedActions', () => {
  it('returns [] for blank, missing or malformed values', () => {
    expect(parseSuggestedActions(null)).toEqual([])
    expect(parseSuggestedActions(undefined)).toEqual([])
    expect(parseSuggestedActions('')).toEqual([])
    expect(parseSuggestedActions('   ')).toEqual([])
    expect(parseSuggestedActions('not json')).toEqual([])
    expect(parseSuggestedActions('{"not":"an array"}')).toEqual([])
  })

  it('parses a well-formed list', () => {
    const value = JSON.stringify([{ id: 'a', aspect: 2, action: 'Asistir a tutorías' }])

    expect(parseSuggestedActions(value)).toEqual([{ id: 'a', aspect: 2, action: 'Asistir a tutorías' }])
  })

  it('drops entries that are not objects, or carry no action text', () => {
    const value = JSON.stringify([null, 'x', 42, { aspect: 1 }, { aspect: 1, action: '   ' }])

    expect(parseSuggestedActions(value)).toEqual([])
  })

  it('fills a missing id with a fresh uuid, and a non-finite aspect with 0', () => {
    const [action] = parseSuggestedActions(JSON.stringify([{ action: 'x', aspect: 'abc' }]))

    expect(action.id).toMatch(/^[0-9a-f-]{36}$/)
    expect(action.aspect).toBe(0)
  })

  it('drops unknown extra fields', () => {
    const [action] = parseSuggestedActions(
      JSON.stringify([{ id: 'a', aspect: 1, action: 'x', extra: 'nope' }]),
    )

    expect(action).toEqual({ id: 'a', aspect: 1, action: 'x' })
  })
})

describe('serializeSuggestedActions', () => {
  it('round-trips through parseSuggestedActions', () => {
    const actions = [{ id: 'a', aspect: 1, action: 'Hacer algo' }]

    expect(parseSuggestedActions(serializeSuggestedActions(actions))).toEqual(actions)
  })
})

describe('newSuggestedActionId', () => {
  it('returns a fresh uuid each time', () => {
    expect(newSuggestedActionId()).not.toBe(newSuggestedActionId())
  })
})
