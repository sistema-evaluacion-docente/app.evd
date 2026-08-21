import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Router } from 'wouter'
import { memoryLocation } from 'wouter/memory-location'

import { useModalityFilter } from '@/hooks/useModalityFilter'

/** Probe that surfaces what the hook reads and lets a test drive what it writes. */
function Probe({ value }: { value?: string | null }) {
  const { modality, setModality } = useModalityFilter()

  return (
    <div>
      <span data-testid="modality">{modality ?? 'none'}</span>

      <button type="button" onClick={() => setModality(value)}>
        set
      </button>
    </div>
  )
}

/** Renders inside a memory router so each test owns its own URL. */
function renderAt(path: string, value?: string | null) {
  const { hook, history } = memoryLocation({ path, record: true })

  return {
    history,
    ...render(
      <Router hook={hook}>
        <Probe value={value} />
      </Router>,
    ),
  }
}

describe('useModalityFilter', () => {
  it('reads the modality from the query string', () => {
    renderAt('/evaluaciones/1?modality=DISTANCIA')

    expect(screen.getByTestId('modality')).toHaveTextContent('DISTANCIA')
  })

  it('reports no modality when the param is absent', () => {
    renderAt('/evaluaciones/1')

    expect(screen.getByTestId('modality')).toHaveTextContent('none')
  })

  it('ignores a param that is not a modality', () => {
    renderAt('/evaluaciones/1?modality=VIRTUAL')

    expect(screen.getByTestId('modality')).toHaveTextContent('none')
  })

  it('accepts a lowercased param', () => {
    renderAt('/evaluaciones/1?modality=presencial')

    expect(screen.getByTestId('modality')).toHaveTextContent('PRESENCIAL')
  })

  it('writes the picked modality into the URL', async () => {
    const user = userEvent.setup()
    const { history } = renderAt('/evaluaciones/1', 'PRESENCIAL')

    await user.click(screen.getByRole('button', { name: 'set' }))

    await waitFor(() => expect(history.at(-1)).toContain('modality=PRESENCIAL'))
  })

  it('clears the filter when the value is not a modality', async () => {
    const user = userEvent.setup()
    const { history } = renderAt('/evaluaciones/1?modality=DISTANCIA', 'ALL')

    await user.click(screen.getByRole('button', { name: 'set' }))

    await waitFor(() => expect(history.at(-1)).not.toContain('modality'))
  })

  it('keeps the other search params untouched', async () => {
    const user = userEvent.setup()
    const { history } = renderAt('/evaluaciones/1?period=2025-1', 'DISTANCIA')

    await user.click(screen.getByRole('button', { name: 'set' }))

    await waitFor(() => {
      expect(history.at(-1)).toContain('period=2025-1')
      expect(history.at(-1)).toContain('modality=DISTANCIA')
    })
  })

  it('replaces the history entry instead of pushing one', async () => {
    const user = userEvent.setup()
    const { history } = renderAt('/evaluaciones/1', 'DISTANCIA')

    await user.click(screen.getByRole('button', { name: 'set' }))

    await waitFor(() => expect(history.at(-1)).toContain('modality=DISTANCIA'))
    expect(history).toHaveLength(1)
  })
})
