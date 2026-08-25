import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { IndicatorPicker } from '@/features/plans/components/IndicatorPicker'
import { SUBJECT_ALL } from '@/features/plans/lib/indicatorMatrix'
import type { IndicatorDimension, PlanSubjectOption } from '@/features/plans/types'

const THRESHOLD = 3.5

function subject(overrides: Partial<PlanSubjectOption> = {}): PlanSubjectOption {
  return {
    key: '1155201::A',
    label: 'POO I · Grupo A',
    course_name: 'POO I',
    course_code: '1155201',
    group_name: 'A',
    academic_group_id: 11,
    program_name: 'INGENIERIA DE SISTEMAS',
    weakCount: 0,
    riskyCount: 0,
    ...overrides,
  }
}

/** A dimension whose scores all clear the threshold. */
function healthyDimension(): IndicatorDimension {
  return {
    dimension: 'Desempeño Docente',
    target_type: 'DIMENSION',
    target_ref: 'Desempeño Docente',
    average: 4.2,
    below_threshold: false,
    suggestions: [],
    questions: [
      {
        target_type: 'QUESTION',
        target_ref: '011',
        code: '011',
        text: 'Asiste puntualmente a clase.',
        average: 4.3,
        below_threshold: false,
        suggestions: [],
      },
    ],
  }
}

function renderPicker({
  subjectsWithFindings = [] as PlanSubjectOption[],
  subjectOptions = [] as PlanSubjectOption[],
  subjectKey = SUBJECT_ALL,
  onSubjectChange = vi.fn(),
  dimensions = [healthyDimension()],
  weakCount = 0,
} = {}) {
  render(
    <IndicatorPicker
      dimensions={dimensions}
      threshold={THRESHOLD}
      comments={{ byDimension: {}, uncategorized: [] }}
      selectedIds={new Set()}
      onToggleIndicator={vi.fn()}
      onToggleComment={vi.fn()}
      aspectByDimension={{ 'Desempeño Docente': 2 }}
      onlyWeak
      onOnlyWeakChange={vi.fn()}
      subjectOptions={subjectOptions}
      subjectsWithFindings={subjectsWithFindings}
      subjectKey={subjectKey}
      onSubjectChange={onSubjectChange}
      weakCount={weakCount}
      riskyCount={0}
      aiStatus="ANALYZED"
    />,
  )

  return { onSubjectChange }
}

afterEach(() => {
  vi.clearAllMocks()
})

describe('IndicatorPicker · lo que el promedio general esconde', () => {
  it('no da el visto bueno cuando el problema está en las asignaturas', () => {
    // A teacher's average over every group can clear the threshold while one of
    // his courses sits under it; the green check there is a lie.
    renderPicker({ subjectsWithFindings: [subject({ weakCount: 3 })] })

    expect(screen.getByText(/El promedio del docente está bien, pero/)).toBeInTheDocument()
    expect(screen.queryByText('Este docente no tiene calificaciones bajas')).not.toBeInTheDocument()
  })

  it('lleva a la asignatura de un clic, en vez de mandar a buscarla', async () => {
    const user = userEvent.setup()
    const { onSubjectChange } = renderPicker({
      subjectsWithFindings: [subject({ weakCount: 2, riskyCount: 1 })],
    })

    await user.click(screen.getByRole('button', { name: /POO I · Grupo A/ }))

    expect(onSubjectChange).toHaveBeenCalledWith('1155201::A')
  })

  it('cuenta los hallazgos de cada asignatura en su botón', () => {
    renderPicker({ subjectsWithFindings: [subject({ weakCount: 2, riskyCount: 1 })] })

    expect(screen.getByRole('button', { name: /POO I · Grupo A · 3/ })).toBeInTheDocument()
  })

  it('lo dice también en la cabecera, que si no seguiría diciendo cero', () => {
    renderPicker({
      subjectsWithFindings: [subject({ weakCount: 1 }), subject({ key: 'otra', weakCount: 2 })],
    })

    expect(screen.getByText(/asignaturas con hallazgos propios/)).toBeInTheDocument()
  })

  it('mantiene el visto bueno cuando de verdad no hay nada en ninguna parte', () => {
    renderPicker({ subjectsWithFindings: [] })

    expect(screen.getByText('Este docente no tiene calificaciones bajas')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Mostrar todas las calificaciones' }),
    ).toBeInTheDocument()
  })

  it('no busca más abajo estando ya dentro de una asignatura', () => {
    // Inside a course there is nowhere further down to look.
    renderPicker({
      subjectKey: '1155201::A',
      subjectOptions: [subject({ weakCount: 3 })],
      subjectsWithFindings: [subject({ weakCount: 3 })],
    })

    expect(screen.getByText('Esta asignatura no tiene calificaciones bajas')).toBeInTheDocument()
    expect(screen.queryByText(/El promedio del docente está bien/)).not.toBeInTheDocument()
  })

  it('marca en el selector la asignatura que tiene hallazgos', async () => {
    const user = userEvent.setup()

    renderPicker({
      subjectOptions: [subject({ weakCount: 2 }), subject({ key: 'sana', label: 'Redes · B' })],
    })

    await user.click(screen.getByRole('combobox', { name: 'Asignatura' }))

    // The reason is spelled out for whoever cannot tell the colour apart.
    expect(await screen.findByText(/2 indicadores bajos/)).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Redes · B/ })).toBeInTheDocument()
  })
})
