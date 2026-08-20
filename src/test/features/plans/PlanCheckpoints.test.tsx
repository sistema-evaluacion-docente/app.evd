import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useUpdateCheckpoint } from '@/features/plans/api'
import { PlanCheckpoints } from '@/features/plans/components/PlanCheckpoints'
import type { Plan, PlanAspect } from '@/features/plans/types'

vi.mock('@/features/plans/api', () => ({ useUpdateCheckpoint: vi.fn() }))

const ASPECTS: PlanAspect[] = [
  { aspect: 1, label: 'Desarrollo de Conocimiento', dimension: 'Dimensión 1' },
  { aspect: 2, label: 'Desempeño Docente', dimension: 'Dimensión 2' },
  { aspect: 3, label: 'Procesos de Evaluación', dimension: 'Dimensión 3' },
  { aspect: 4, label: 'Integración Interpersonal', dimension: 'Dimensión 4' },
  { aspect: 5, label: 'Observaciones de los Estudiantes', dimension: null },
]

/** A plan committed on aspects 1 and 3 only, with both follow-ups still empty. */
function buildPlan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 7,
    items: [
      { id: 1, aspect: 1, description: 'Expresa sus ideas', commitment: 'Estructurar la clase' },
      { id: 2, aspect: 3, description: 'Retroalimenta tarde', commitment: 'Devolver en 8 días' },
    ],
    checkpoints: [
      {
        id: 11,
        plan_id: 7,
        stage: 'PRIMER_SEGUIMIENTO',
        scheduled_date: null,
        completed_at: null,
        status: 'PENDIENTE',
        notes: null,
        aspect_notes: [],
      },
      {
        id: 12,
        plan_id: 7,
        stage: 'SEGUNDO_SEGUIMIENTO',
        scheduled_date: null,
        completed_at: null,
        status: 'PENDIENTE',
        notes: null,
        aspect_notes: [],
      },
    ],
    ...overrides,
  } as unknown as Plan
}

function mockUpdate({ isPending = false } = {}) {
  const mutate = vi.fn()

  vi.mocked(useUpdateCheckpoint).mockReturnValue({ mutate, isPending } as unknown as ReturnType<
    typeof useUpdateCheckpoint
  >)

  return mutate
}

describe('PlanCheckpoints', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('follows up only on the aspects the plan committed to', () => {
    mockUpdate()

    render(<PlanCheckpoints plan={buildPlan()} aspects={ASPECTS} canManage />)

    expect(screen.getAllByText(/Desarrollo de Conocimiento/)).not.toHaveLength(0)
    expect(screen.getAllByText(/Procesos de Evaluación/)).not.toHaveLength(0)
    expect(screen.queryByText(/Desempeño Docente/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Integración Interpersonal/)).not.toBeInTheDocument()
  })

  it('counts against the committed aspects, not against the five', () => {
    mockUpdate()

    render(<PlanCheckpoints plan={buildPlan()} aspects={ASPECTS} canManage />)

    expect(screen.getAllByText(/aspectos registrados/)[0]).toHaveTextContent('0/2')
  })

  it('keeps an aspect that already carries a note, even without commitments', () => {
    mockUpdate()

    const plan = buildPlan()
    plan.checkpoints[0].aspect_notes = [{ id: 99, aspect: 4, note: 'Mejoró el trato con el grupo' }]

    render(<PlanCheckpoints plan={plan} aspects={ASPECTS} canManage />)

    expect(screen.getAllByText(/Integración Interpersonal/)).not.toHaveLength(0)
  })

  it('offers only the committed aspects in the form', async () => {
    const user = userEvent.setup()
    mockUpdate()

    render(<PlanCheckpoints plan={buildPlan()} aspects={ASPECTS} canManage />)

    await user.click(screen.getAllByRole('button', { name: 'Registrar' })[0])

    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })

  it('holds the editor open with the button spinning while it saves', async () => {
    const user = userEvent.setup()
    mockUpdate()

    const { rerender } = render(<PlanCheckpoints plan={buildPlan()} aspects={ASPECTS} canManage />)

    await user.click(screen.getAllByRole('button', { name: 'Registrar' })[0])

    mockUpdate({ isPending: true })
    rerender(<PlanCheckpoints plan={buildPlan()} aspects={ASPECTS} canManage />)

    const save = screen.getByRole('button', { name: /Guardando/ })

    expect(save).toBeDisabled()
    expect(save).toHaveAttribute('aria-busy', 'true')
    // The form is still there: nothing closed over stale data.
    expect(screen.getAllByRole('textbox')).toHaveLength(2)
  })

  it('no guarda un seguimiento en blanco y dice qué falta', async () => {
    const user = userEvent.setup()
    const mutate = mockUpdate()

    render(<PlanCheckpoints plan={buildPlan()} aspects={ASPECTS} canManage />)

    await user.click(screen.getAllByRole('button', { name: 'Registrar' })[0])
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(mutate).not.toHaveBeenCalled()
    // El editor sigue abierto, con los tres campos en rojo.
    expect(screen.getByRole('alert')).toHaveTextContent('Faltan 3 campos obligatorios')
    for (const note of screen.getAllByRole('textbox')) {
      expect(note).toHaveAttribute('aria-invalid', 'true')
    }
  })

  it('no pinta de rojo un campo al que todavía no se ha llegado', async () => {
    const user = userEvent.setup()
    mockUpdate()

    render(<PlanCheckpoints plan={buildPlan()} aspects={ASPECTS} canManage />)

    await user.click(screen.getAllByRole('button', { name: 'Registrar' })[0])

    const [first, second] = screen.getAllByRole('textbox')

    expect(first).toHaveAttribute('aria-invalid', 'false')

    // Salir de la primera observación vacía es lo que la enciende — y sólo a ella.
    await user.click(first)
    await user.click(second)

    expect(first).toHaveAttribute('aria-invalid', 'true')
    expect(second).toHaveAttribute('aria-invalid', 'false')
  })

  it('guarda una vez hay fecha y observación de cada aspecto', async () => {
    const user = userEvent.setup()
    const mutate = mockUpdate()

    const plan = buildPlan()
    plan.checkpoints[0].scheduled_date = '2026-05-04'

    render(<PlanCheckpoints plan={plan} aspects={ASPECTS} canManage />)

    await user.click(screen.getAllByRole('button', { name: 'Registrar' })[0])

    const [first, second] = screen.getAllByRole('textbox')

    await user.type(first, 'Estructuró mejor la clase')
    await user.type(second, '  Devolvió las notas a tiempo  ')
    await user.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(mutate).toHaveBeenCalledWith(
      {
        checkpointId: 11,
        payload: {
          scheduled_date: '2026-05-04',
          aspect_notes: [
            { aspect: 1, note: 'Estructuró mejor la clase' },
            { aspect: 3, note: 'Devolvió las notas a tiempo' },
          ],
        },
      },
      expect.anything(),
    )
  })

  it('says so when there is nothing to follow up on yet', () => {
    mockUpdate()

    render(<PlanCheckpoints plan={buildPlan({ items: [] })} aspects={ASPECTS} canManage />)

    expect(screen.getByText(/No hay compromisos a los que hacer seguimiento/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Registrar' })).not.toBeInTheDocument()
  })
})
