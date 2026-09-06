import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useClosePlan } from '@/features/plans/api'
import { PlanClosedSummary, PlanClosure } from '@/features/plans/components/PlanClosure'
import type { Plan, PlanDocument } from '@/features/plans/types'
import { render, screen, within } from '@/test/render'

vi.mock('@/features/plans/api', () => ({ useClosePlan: vi.fn() }))

const mutate = vi.fn()

function mockClosePlan({ isPending = false } = {}) {
  vi.mocked(useClosePlan).mockReturnValue({ mutate, isPending } as unknown as ReturnType<
    typeof useClosePlan
  >)
}

function document(overrides: Partial<PlanDocument> = {}): PlanDocument {
  return {
    id: 1,
    plan_id: 5,
    format_type: 'FORMATO_3',
    has_generated: true,
    has_signed: false,
    signed_at: null,
    signed_filename: null,
    ...overrides,
  } as unknown as PlanDocument
}

function plan(overrides: Partial<Plan> = {}): Plan {
  return {
    id: 5,
    documents: [],
    ...overrides,
  } as unknown as Plan
}

beforeEach(() => {
  vi.clearAllMocks()
  mockClosePlan()
})

describe('PlanClosure', () => {
  it('blocks closing until the Formato 3 is signed', () => {
    render(<PlanClosure plan={plan({ documents: [document({ has_signed: false })] })} />)

    expect(screen.getByRole('button', { name: 'Cerrar plan' })).toBeDisabled()
    expect(screen.getByText(/Falta el Formato 3 firmado/)).toBeInTheDocument()
  })

  it('allows closing once the signed Formato 3 is on file', () => {
    render(
      <PlanClosure
        plan={plan({
          documents: [document({ has_signed: true, signed_at: '2028-03-04T10:00:00Z' })],
        })}
      />,
    )

    expect(screen.getByRole('button', { name: 'Cerrar plan' })).toBeEnabled()
    expect(screen.getByText(/Formato 3 firmado/)).toBeInTheDocument()
  })

  it('keeps the confirm button off until a result is picked, then submits it with the reason', async () => {
    const user = userEvent.setup()
    render(
      <PlanClosure plan={plan({ documents: [document({ has_signed: true })] })} />,
    )

    await user.click(screen.getByRole('button', { name: 'Cerrar plan' }))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Cerrar plan' })
    expect(confirm).toBeDisabled()

    await user.click(within(dialog).getByRole('radio', { name: /^Cumplido/ }))
    expect(confirm).toBeEnabled()

    await user.type(within(dialog).getByLabelText('Información adicional'), '  Buen avance  ')
    await user.click(confirm)

    expect(mutate).toHaveBeenCalledWith(
      { result: 'CUMPLIDO', reason: 'Buen avance' },
      expect.any(Object),
    )
  })

  it('sends no reason when the field is left blank', async () => {
    const user = userEvent.setup()
    render(<PlanClosure plan={plan({ documents: [document({ has_signed: true })] })} />)

    await user.click(screen.getByRole('button', { name: 'Cerrar plan' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('radio', { name: /^No cumplido/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Cerrar plan' }))

    expect(mutate).toHaveBeenCalledWith({ result: 'NO_CUMPLIDO', reason: undefined }, expect.any(Object))
  })

  it('closes the dialog on cancel without submitting anything', async () => {
    const user = userEvent.setup()
    render(<PlanClosure plan={plan({ documents: [document({ has_signed: true })] })} />)

    await user.click(screen.getByRole('button', { name: 'Cerrar plan' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Cancelar' }))

    expect(mutate).not.toHaveBeenCalled()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('PlanClosedSummary', () => {
  it('shows the result, closing date and reason', () => {
    render(
      <PlanClosedSummary
        plan={
          {
            status: 'CERRADO_CUMPLIDO',
            closed_at: '2028-06-01T00:00:00Z',
            close_reason: 'Cumplió con lo acordado',
          } as unknown as Plan
        }
      />,
    )

    expect(screen.getByText('Cerrado · cumplido')).toBeInTheDocument()
    expect(screen.getByText('Cumplió con lo acordado')).toBeInTheDocument()
  })

  it('omits the date and reason rows when absent', () => {
    render(
      <PlanClosedSummary
        plan={
          {
            status: 'CERRADO_NO_CUMPLIDO',
            closed_at: null,
            close_reason: null,
          } as unknown as Plan
        }
      />,
    )

    expect(screen.queryByText('Fecha')).not.toBeInTheDocument()
    expect(screen.queryByText('Motivo')).not.toBeInTheDocument()
  })
})
