import { describe, expect, it } from 'vitest'

import { hasSignedActa, planProgress, planProgressStage } from '@/features/plans/lib/planStatus'
import type { Plan, PlanCheckpoint, PlanDocument, PlanStatus } from '@/features/plans/types'

function checkpoint(stage: PlanCheckpoint['stage'], recorded = false): PlanCheckpoint {
  return {
    id: stage === 'PRIMER_SEGUIMIENTO' ? 11 : 12,
    plan_id: 7,
    stage,
    scheduled_date: recorded ? '2026-05-04' : null,
    completed_at: null,
    status: 'PENDIENTE',
    notes: null,
    aspect_notes: [],
  }
}

function signedActa(): PlanDocument {
  return {
    id: 1,
    plan_id: 7,
    format_type: 'FORMATO_2',
    generated_at: null,
    generated_by: null,
    signed_at: '2026-03-03T10:00:00Z',
    signed_by: 1,
    signed_filename: 'ficha.pdf',
    has_generated: true,
    has_signed: true,
  }
}

function buildPlan({
  status = 'EN_SEGUIMIENTO' as PlanStatus,
  signed = false,
  first = false,
  second = false,
}: { status?: PlanStatus; signed?: boolean; first?: boolean; second?: boolean } = {}): Plan {
  return {
    id: 7,
    status,
    documents: signed ? [signedActa()] : [],
    checkpoints: [
      checkpoint('PRIMER_SEGUIMIENTO', first),
      checkpoint('SEGUNDO_SEGUIMIENTO', second),
    ],
  } as unknown as Plan
}

describe('planProgress', () => {
  it('arranca en cero mientras el acuerdo no está firmado', () => {
    expect(planProgress(buildPlan())).toBe(0)
  })

  it('cuenta la firma del acuerdo como el primer cuarto del camino', () => {
    expect(planProgress(buildPlan({ signed: true }))).toBe(25)
  })

  it('sube con cada corte del semestre', () => {
    expect(planProgress(buildPlan({ signed: true, first: true }))).toBe(50)
    expect(planProgress(buildPlan({ signed: true, first: true, second: true }))).toBe(75)
  })

  it('deja el 100% para el cierre: con los dos seguimientos el plan sigue abierto', () => {
    const done = buildPlan({ signed: true, first: true, second: true })

    expect(planProgress(done)).toBeLessThan(100)
    expect(planProgress({ ...done, status: 'CERRADO_CUMPLIDO' })).toBe(100)
  })

  it('un plan cerrado está terminado, aunque le falten cortes', () => {
    expect(planProgress(buildPlan({ status: 'CERRADO_NO_CUMPLIDO' }))).toBe(100)
    expect(planProgress(buildPlan({ status: 'CERRADO_MANUAL' }))).toBe(100)
  })

  it('no depende del cumplimiento que calcula la API, que no se mueve en todo el semestre', () => {
    const plan = { ...buildPlan({ signed: true, first: true }), progress: 0 } as Plan

    expect(plan.progress).toBe(0)
    expect(planProgress(plan)).toBe(50)
  })

  it('no tumba una tabla cuyo payload viene sin relaciones', () => {
    const row = { status: 'EN_SEGUIMIENTO' } as unknown as Plan

    expect(planProgress(row)).toBe(0)
    expect(planProgressStage(row)).toBe('Acuerdo sin firmar')
  })
})

describe('planProgressStage', () => {
  it('nombra el hito en el que está el plan', () => {
    expect(planProgressStage(buildPlan())).toBe('Acuerdo sin firmar')
    expect(planProgressStage(buildPlan({ signed: true }))).toBe(
      'Acuerdo firmado · sin seguimientos todavía',
    )
    expect(planProgressStage(buildPlan({ signed: true, first: true }))).toBe(
      'Primer seguimiento registrado',
    )
    expect(planProgressStage(buildPlan({ signed: true, first: true, second: true }))).toBe(
      'Seguimientos completos · falta cerrar el plan',
    )
    expect(planProgressStage(buildPlan({ status: 'CERRADO_CUMPLIDO' }))).toBe('Plan cerrado')
  })
})

describe('hasSignedActa', () => {
  it('sólo mira la Ficha de acuerdo, no cualquier formato firmado', () => {
    const plan = buildPlan()
    const otherFormat = { ...signedActa(), format_type: 'FORMATO_3' as const }

    expect(hasSignedActa({ ...plan, documents: [otherFormat] } as Plan)).toBe(false)
    expect(hasSignedActa(buildPlan({ signed: true }))).toBe(true)
  })

  it('un formato generado pero sin firmar no cuenta', () => {
    const unsigned = { ...signedActa(), has_signed: false, signed_at: null }

    expect(hasSignedActa({ ...buildPlan(), documents: [unsigned] } as Plan)).toBe(false)
  })
})
