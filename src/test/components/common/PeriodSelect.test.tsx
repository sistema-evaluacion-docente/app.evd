import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { PeriodSelect, type PeriodSelectOption } from '@/components/common/PeriodSelect'
import { useGetAcademicPeriods } from '@/features/periods'

/**
 * The component reads periods through the feature's public API and caches them
 * in its Zustand store; both are mocked here so the test stays on the
 * component's own behavior (selection, URL sync) instead of the query layer.
 */
vi.mock('@/features/periods', () => ({
  useGetAcademicPeriods: vi.fn(),
  useAcademicPeriodsStore: (selector: (state: unknown) => unknown) =>
    selector({ periods: [], setPeriods: vi.fn() }),
}))

const PERIODS: PeriodSelectOption[] = [
  { id: 1, name: '2024-1', code: '2024-1' },
  { id: 2, name: '2025-1', code: '2025-1' },
]

/** Only the fields `PeriodSelect` reads are relevant to these tests. */
function mockPeriodsQuery({
  data = PERIODS,
  isLoading = false,
}: { data?: PeriodSelectOption[] | undefined; isLoading?: boolean } = {}) {
  vi.mocked(useGetAcademicPeriods).mockReturnValue({
    data: data ? { data } : undefined,
    isLoading,
  } as unknown as ReturnType<typeof useGetAcademicPeriods>)
}

/** Renders inside a memory router so URL-mode tests don't leak into each other. */
function renderAt(ui: ReactNode, path = '/evaluaciones') {
  const { hook, history } = memoryLocation({ path, record: true })

  return { history, ...render(<Router hook={hook}>{ui}</Router>) }
}

describe('PeriodSelect', () => {
  beforeEach(() => {
    mockPeriodsQuery()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('shows a spinner while the periods are loading', () => {
    mockPeriodsQuery({ data: undefined, isLoading: true })

    renderAt(<PeriodSelect />)

    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('skips the loading state when the options come from the caller', () => {
    mockPeriodsQuery({ data: undefined, isLoading: true })

    renderAt(<PeriodSelect options={PERIODS} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Periodo académico' })).toBeInTheDocument()
  })

  it('preselects the most recent period when no value is given', () => {
    renderAt(<PeriodSelect />)

    expect(screen.getByRole('combobox')).toHaveTextContent('2025-1')
  })

  it('shows the controlled value instead of the default one', () => {
    renderAt(<PeriodSelect value={1} />)

    expect(screen.getByRole('combobox')).toHaveTextContent('2024-1')
  })

  it('lists every period, most recent first', async () => {
    const user = userEvent.setup()

    renderAt(<PeriodSelect />)

    await user.click(screen.getByRole('combobox'))

    const options = await screen.findAllByRole('option')

    expect(options.map((option) => option.textContent)).toEqual(['2025-1', '2024-1'])
  })

  it('reports the id of the period the user picks', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    renderAt(<PeriodSelect onValueChange={onValueChange} />)

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '2024-1' }))

    expect(onValueChange).toHaveBeenCalledWith(1)
  })

  it('falls back to the period code when a period has no name', () => {
    renderAt(<PeriodSelect options={[{ id: 9, name: '', code: '2023-2' }]} />)

    expect(screen.getByRole('combobox')).toHaveTextContent('2023-2')
  })

  it('selects the period named in the search param', () => {
    renderAt(<PeriodSelect searchParam="period" />, '/evaluaciones?period=2024-1')

    expect(screen.getByRole('combobox')).toHaveTextContent('2024-1')
  })

  it('writes the default period into the search param when it is missing', async () => {
    const { history } = renderAt(<PeriodSelect searchParam="period" />)

    await waitFor(() => expect(history.at(-1)).toContain('period=2025-1'))
  })

  it('updates the search param when the user picks another period', async () => {
    const user = userEvent.setup()

    const { history } = renderAt(
      <PeriodSelect searchParam="period" />,
      '/evaluaciones?period=2025-1',
    )

    await user.click(screen.getByRole('combobox'))
    await user.click(await screen.findByRole('option', { name: '2024-1' }))

    await waitFor(() => expect(history.at(-1)).toContain('period=2024-1'))
  })

  it('does not open the list when disabled', async () => {
    const user = userEvent.setup()

    renderAt(<PeriodSelect disabled />)

    await user.click(screen.getByRole('combobox'))

    expect(screen.queryByRole('option')).not.toBeInTheDocument()
  })
})
