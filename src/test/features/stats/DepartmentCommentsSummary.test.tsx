import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { DepartmentCommentsSummary } from '@/features/stats/components/DepartmentCommentsSummary'

// Only the display map the notice reads. Importing the real feature pulls in
// the axios instance and, with it, the auth store.
vi.mock('@/features/evaluations', () => ({
  AI_STATUS_DISPLAY: {
    PENDING: { label: 'Pendiente', className: '' },
    ANALYZING: { label: 'Analizando', className: '' },
    ANALYZED: { label: 'Completado', className: '' },
    FAILED: { label: 'Fallido', className: '' },
  },
}))

const COUNTS = { BAJO: 0, MEDIO: 0, ALTO: 0 }

describe('DepartmentCommentsSummary · comentarios sin analizar', () => {
  it('says why the charts are empty instead of drawing a flat axis', () => {
    // All-zero counts are what a period looks like before the model has read a
    // single comment, and an empty bar chart says nothing about which of the two
    // it is.
    render(<DepartmentCommentsSummary riskCounts={COUNTS} categoryCounts={{}} aiStatus="PENDING" />)

    expect(
      screen.getByText('Analiza los comentarios con IA para poder mostrar las estadísticas.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Por nivel de riesgo')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Forma de ver los comentarios' }),
    ).not.toBeInTheDocument()
  })

  it('waits instead of guessing while the AI status is still on its way', () => {
    // The counts land one request before the status they have to be read
    // against: deciding on that gap is what drew the empty charts for a moment
    // on every reload.
    render(
      <DepartmentCommentsSummary
        riskCounts={COUNTS}
        categoryCounts={{}}
        aiStatus={null}
        isStatusPending
      />,
    )

    expect(
      screen.getByRole('status', { name: 'Cargando los comentarios del periodo' }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Por nivel de riesgo')).not.toBeInTheDocument()
    expect(
      screen.queryByText('Analiza los comentarios con IA para poder mostrar las estadísticas.'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('group', { name: 'Forma de ver los comentarios' }),
    ).not.toBeInTheDocument()
  })

  it('keeps waiting even when a status is already at hand for the period before', () => {
    render(
      <DepartmentCommentsSummary
        riskCounts={COUNTS}
        categoryCounts={{}}
        aiStatus="PENDING"
        isStatusPending
      />,
    )

    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Analizar' })).not.toBeInTheDocument()
  })

  it('runs the analysis from the notice itself', async () => {
    const onAnalyze = vi.fn()

    render(
      <DepartmentCommentsSummary
        riskCounts={COUNTS}
        categoryCounts={{}}
        aiStatus="PENDING"
        onAnalyze={onAnalyze}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Analizar' }))

    expect(onAnalyze).toHaveBeenCalledOnce()
  })

  it('waits out a run in progress instead of offering it again', () => {
    render(
      <DepartmentCommentsSummary
        riskCounts={COUNTS}
        categoryCounts={{}}
        aiStatus="ANALYZING"
        onAnalyze={vi.fn()}
        isAnalyzing
      />,
    )

    const button = screen.getByRole('button', { name: /Analizando/ })

    expect(button).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Analizar' })).not.toBeInTheDocument()
  })

  it('offers the run again after a failed one, saying so', () => {
    render(
      <DepartmentCommentsSummary
        riskCounts={COUNTS}
        categoryCounts={{}}
        aiStatus="FAILED"
        onAnalyze={vi.fn()}
      />,
    )

    expect(screen.getByText(/El análisis anterior falló/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Analizar' })).toBeEnabled()
  })

  it('gets out of the way once the comments have been analyzed', () => {
    render(
      <DepartmentCommentsSummary
        riskCounts={{ BAJO: 4, MEDIO: 2, ALTO: 1 }}
        categoryCounts={{ LABEL_0: 3 }}
        aiStatus="ANALYZED"
        onAnalyze={vi.fn()}
      />,
    )

    expect(screen.getByText('Por nivel de riesgo')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Analizar' })).not.toBeInTheDocument()
  })

  it('draws the charts as before when no AI status is passed at all', () => {
    // The prop is optional: every other caller of this card keeps its behaviour.
    render(<DepartmentCommentsSummary riskCounts={COUNTS} categoryCounts={{}} />)

    expect(screen.getByText('Por nivel de riesgo')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Forma de ver los comentarios' })).toBeInTheDocument()
  })
})
