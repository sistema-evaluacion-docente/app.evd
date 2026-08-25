import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetPlanIndicators, useGetPlans } from '@/features/plans/api'
import {
  useIndicatorSelection,
  type SelectionEntry,
} from '@/features/plans/hooks/useIndicatorSelection'
import type { Plan, PlanIndicators } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({
  useGetPlanIndicators: vi.fn(),
  useGetPlans: vi.fn(),
}))

let selectedRole = 'DIRECTOR DE DEPARTAMENTO'

vi.mock('@/features/auth', () => ({
  ROLE: {
    ADMIN: 'ADMIN',
    TEACHER: 'DOCENTE',
    DEPARTMENT_DIRECTOR: 'DIRECTOR DE DEPARTAMENTO',
  },
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ selectedRole }),
}))

const PERIOD = '2025-1'

const catalogue = {
  threshold: 3.4,
  aspects: [
    { aspect: 2, label: 'Desempeño Docente', dimension: 'Desempeño Docente' },
    { aspect: 5, label: 'Observaciones de los Estudiantes', dimension: null },
  ],
  overall: { target_type: 'OVERALL_AVERAGE', target_ref: null, label: 'General', suggestions: [] },
  dimensions: [],
} as unknown as PlanIndicators

const QUESTION: SelectionEntry = {
  kind: 'question',
  ref: '011',
  subjectKey: null,
  label: '011 · Asiste puntualmente',
  subjectLabel: null,
}

const DIMENSION: SelectionEntry = {
  kind: 'dimension',
  ref: 'Desempeño Docente',
  subjectKey: null,
  label: 'Desempeño Docente',
  subjectLabel: null,
}

function setup({ plans = [] as Plan[] } = {}) {
  vi.mocked(useGetPlanIndicators).mockReturnValue({
    data: { data: catalogue },
  } as unknown as ReturnType<typeof useGetPlanIndicators>)

  vi.mocked(useGetPlans).mockReturnValue({
    data: { data: plans },
    isPending: false,
  } as unknown as ReturnType<typeof useGetPlans>)

  const { hook, history } = memoryLocation({ path: '/docentes/42', record: true })

  function wrapper({ children }: { children: ReactNode }) {
    return <Router hook={hook}>{children}</Router>
  }

  const view = renderHook(
    ({ periodCode }: { periodCode?: string }) =>
      useIndicatorSelection({ teacherId: 42, periodCode }),
    { wrapper, initialProps: { periodCode: PERIOD as string | undefined } },
  )

  return { ...view, history }
}

/** Turns the mode on and marks every entry given, flushing between each. */
function markAll(
  result: { current: ReturnType<typeof useIndicatorSelection> },
  entries: SelectionEntry[],
) {
  act(() => result.current.start())

  for (const entry of entries) {
    act(() => result.current.toggle(entry))
  }
}

afterEach(() => {
  selectedRole = 'DIRECTOR DE DEPARTAMENTO'
  vi.clearAllMocks()
})

describe('useIndicatorSelection', () => {
  it('stays shut for anyone who does not run improvement plans', () => {
    // The profile is the same component a teacher reads their own report on.
    selectedRole = 'DOCENTE'
    const { result } = setup()

    act(() => result.current.start())

    expect(result.current.active).toBe(false)
  })

  it('does not ask for the department plans as a teacher', () => {
    selectedRole = 'DOCENTE'
    setup()

    expect(vi.mocked(useGetPlans)).toHaveBeenCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('carries the marked indicators to a new plan on the period being read', () => {
    const { result, history } = setup()

    markAll(result, [QUESTION, DIMENSION])
    act(() => result.current.submit())

    expect(history[history.length - 1]).toBe(
      '/planes/nuevo?teacher=42&period_code=2025-1&picks=q%3A011%2Cd%3A2',
    )
  })

  it('adds to the plan the period already has instead of starting a second one', () => {
    const { result, history } = setup({
      plans: [{ id: 9, origin_period_code: PERIOD, acta_locked: false } as unknown as Plan],
    })

    markAll(result, [QUESTION])
    act(() => result.current.submit())

    expect(history[history.length - 1]).toBe('/planes/9/editar?picks=q%3A011')
  })

  it('starts a new plan when the acta of the existing one is already closed', () => {
    const { result, history } = setup({
      plans: [{ id: 9, origin_period_code: PERIOD, acta_locked: true } as unknown as Plan],
    })

    markAll(result, [QUESTION])
    act(() => result.current.submit())

    expect(history[history.length - 1]).toContain('/planes/nuevo')
  })

  it('drops a dimension the catalogue cannot place in an aspect', () => {
    // Filing it under the wrong section of the acta is worse than losing it.
    const { result, history } = setup()

    markAll(result, [{ ...DIMENSION, ref: 'Dimensión inventada' }])
    act(() => result.current.submit())

    expect(history[history.length - 1]).toBe('/planes/nuevo?teacher=42&period_code=2025-1')
  })

  it('keeps the same indicator on two asignaturas as two marks, and says so', () => {
    const { result } = setup()

    markAll(result, [QUESTION, { ...QUESTION, subjectKey: '1155::A', subjectLabel: 'POO I' }])

    expect(result.current.count).toBe(2)
    expect(result.current.markedElsewhere('question', '011', null)).toBe(1)
    expect(result.current.markedElsewhere('question', '011', '1155::A')).toBe(1)
  })

  it('toggles a mark off when it is picked again', () => {
    const { result } = setup()

    markAll(result, [QUESTION, QUESTION])

    expect(result.current.count).toBe(0)
  })

  it('adds only what is missing when the weak ones are marked in bulk', () => {
    const { result } = setup()

    markAll(result, [QUESTION])
    act(() => result.current.markMany([QUESTION, { ...QUESTION, ref: '012', label: '012 · Otra' }]))

    expect(result.current.count).toBe(2)
  })

  it('drops the selection when the period changes under it', () => {
    const { result, rerender } = setup()

    markAll(result, [QUESTION])
    expect(result.current.count).toBe(1)

    rerender({ periodCode: '2024-2' })

    // A pick only means anything against the scores it was read on.
    expect(result.current.count).toBe(0)
    expect(result.current.active).toBe(false)
  })

  it('reads the institutional threshold from the catalogue', () => {
    const { result } = setup()

    act(() => result.current.start())

    expect(result.current.threshold).toBe(3.4)
  })
})
