import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useGetPlans } from '@/features/plans/api'
import { TeacherPlanAction } from '@/features/plans/components/TeacherPlanAction'
import type { Plan } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({ useGetPlans: vi.fn() }))

/** The role the director is signed in as, which is what gates the actions. */
let selectedRole = 'DIRECTOR DE DEPARTAMENTO'

vi.mock('@/features/auth', () => ({
  ROLE: {
    ADMIN: 'ADMIN',
    TEACHER: 'DOCENTE',
    DEPARTMENT_DIRECTOR: 'DIRECTOR DE DEPARTAMENTO',
  },
  useAuthStore: (selector: (state: unknown) => unknown) => selector({ selectedRole }),
}))

const PLAN = {
  id: 7,
  title: 'Plan de mejoramiento',
  teacher_name: 'Ada Lovelace',
  status: 'EN_SEGUIMIENTO',
} as unknown as Plan

function renderAction({
  plans = [PLAN],
  name,
  isPending = false,
}: { plans?: Plan[]; name?: string; isPending?: boolean } = {}) {
  vi.mocked(useGetPlans).mockReturnValue({
    data: isPending ? undefined : { data: plans },
    isPending,
  } as unknown as ReturnType<typeof useGetPlans>)

  const { hook, history } = memoryLocation({ path: '/docentes/42', record: true })

  const { container } = render(
    <Router hook={hook}>
      <TeacherPlanAction teacherId={42} teacherName={name} periodCode="2028-2" />
    </Router>,
  )

  return { container, history }
}

afterEach(() => {
  selectedRole = 'DIRECTOR DE DEPARTAMENTO'
  vi.clearAllMocks()
})

describe('TeacherPlanAction', () => {
  it('opens the whole history of the teacher in the plans directory', async () => {
    const user = userEvent.setup()
    const { history } = renderAction({ name: 'Ada Lovelace' })

    await user.click(screen.getByRole('button', { name: 'Ver historial' }))

    expect(history[history.length - 1]).toBe(
      '/planes?docente=42&nombre=Ada%20Lovelace&periodo=todos',
    )
  })

  it('names the teacher from his own plan when the profile passed none', async () => {
    const user = userEvent.setup()
    const { history } = renderAction()

    await user.click(screen.getByRole('button', { name: 'Ver historial' }))

    expect(history[history.length - 1]).toBe(
      '/planes?docente=42&nombre=Ada%20Lovelace&periodo=todos',
    )
  })

  it('offers no history when the teacher has never had a plan', () => {
    renderAction({ plans: [] })

    expect(screen.queryByRole('button', { name: 'Ver historial' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear plan/ })).toBeInTheDocument()
  })

  it('shows nothing at all to a teacher looking at a profile', () => {
    selectedRole = 'DOCENTE'
    renderAction()

    expect(screen.queryByRole('button', { name: 'Ver historial' })).not.toBeInTheDocument()
  })

  it('holds its verdict while the plans of the teacher are on their way', () => {
    const { container } = renderAction({ isPending: true })

    expect(container.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(0)

    // Neither answer yet: no "he has none, create one", no plan to open.
    expect(screen.queryByText(/no tiene un plan/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Crear plan/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver plan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ver historial' })).not.toBeInTheDocument()
  })
})
