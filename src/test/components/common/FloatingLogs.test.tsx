import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { FloatingLogs, type LogEntry } from '@/components/common/FloatingLogs'

const LOGS: LogEntry[] = [
  { id: '1', level: 'info', message: 'Iniciando procesamiento' },
  { id: '2', level: 'success', message: 'Listo', meta: 'PDF procesado' },
]

describe('FloatingLogs', () => {
  it('renders nothing when there are no logs', () => {
    const { container } = render(<FloatingLogs logs={[]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows every log entry and its count', () => {
    render(<FloatingLogs logs={LOGS} />)

    expect(screen.getByText('Iniciando procesamiento')).toBeInTheDocument()
    expect(screen.getByText('Listo')).toBeInTheDocument()
    expect(screen.getByText('PDF procesado')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('uses the given title', () => {
    render(<FloatingLogs logs={LOGS} title="Carga de docentes" />)

    expect(screen.getByText('Carga de docentes')).toBeInTheDocument()
  })

  it('is expanded by default', () => {
    render(<FloatingLogs logs={LOGS} />)

    expect(screen.getByText('Iniciando procesamiento')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Colapsar' })).toBeInTheDocument()
  })

  it('starts collapsed when defaultExpanded is false', () => {
    render(<FloatingLogs logs={LOGS} defaultExpanded={false} />)

    expect(screen.queryByText('Iniciando procesamiento')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expandir' })).toBeInTheDocument()
  })

  it('toggles the log list when the expand/collapse button is clicked', async () => {
    const user = userEvent.setup()

    render(<FloatingLogs logs={LOGS} />)

    await user.click(screen.getByRole('button', { name: 'Colapsar' }))

    expect(screen.queryByText('Iniciando procesamiento')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Expandir' })).toBeInTheDocument()
  })

  it('does not render a close button without onClear', () => {
    render(<FloatingLogs logs={LOGS} />)

    expect(screen.queryByRole('button', { name: 'Cerrar' })).not.toBeInTheDocument()
  })

  it('runs onClear when the close button is clicked', async () => {
    const user = userEvent.setup()
    const onClear = vi.fn()

    render(<FloatingLogs logs={LOGS} onClear={onClear} />)

    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(onClear).toHaveBeenCalledTimes(1)
  })

  it('renders the footer only once the task is finished', () => {
    const { rerender } = render(<FloatingLogs logs={LOGS} footer={<span>Ver detalles</span>} />)

    expect(screen.queryByText('Ver detalles')).not.toBeInTheDocument()

    rerender(<FloatingLogs logs={LOGS} footer={<span>Ver detalles</span>} isFinished />)

    expect(screen.getByText('Ver detalles')).toBeInTheDocument()
  })
})
