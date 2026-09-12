import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import {
  ActaStatusBadge,
  EvidenceRequestBadge,
  EvidenceStatusBadge,
  PlanStatusBadge,
} from '@/features/plans/components/PlanStatusBadge'
import type {
  ActaStatus,
  EvidenceRequestStatus,
  EvidenceStatus,
  PlanStatus,
} from '@/features/plans/types'

describe('PlanStatusBadge', () => {
  const cases: [PlanStatus, string][] = [
    ['BORRADOR', 'Borrador'],
    ['EN_SEGUIMIENTO', 'En seguimiento'],
    ['RESULTADO_DISPONIBLE', 'Resultado disponible'],
    ['CERRADO_CUMPLIDO', 'Cerrado · cumplido'],
    ['CERRADO_NO_CUMPLIDO', 'Cerrado · no cumplido'],
  ]

  it.each(cases)('labels %s as "%s"', (status, label) => {
    render(<PlanStatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('shows the raw value instead of "undefined" for a status the app does not know', () => {
    render(<PlanStatusBadge status={'CERRADO_MANUAL' as PlanStatus} />)

    expect(screen.getByText('CERRADO_MANUAL')).toBeInTheDocument()
  })
})

describe('ActaStatusBadge', () => {
  const cases: [ActaStatus, string][] = [
    ['BORRADOR', 'Acta en borrador'],
    ['CERRADA', 'Acta cerrada'],
    ['FIRMADA', 'Acta firmada'],
  ]

  it.each(cases)('labels %s as "%s"', (status, label) => {
    render(<ActaStatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

describe('EvidenceStatusBadge', () => {
  const cases: [EvidenceStatus, string][] = [
    ['PENDIENTE', 'Pendiente de revisión'],
    ['APROBADA', 'Aprobada'],
    ['RECHAZADA', 'Rechazada'],
  ]

  it.each(cases)('labels %s as "%s"', (status, label) => {
    render(<EvidenceStatusBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})

describe('EvidenceRequestBadge', () => {
  const cases: [EvidenceRequestStatus, string][] = [
    ['PENDIENTE', 'Pendiente de entrega'],
    ['EN_REVISION', 'En revisión'],
    ['APROBADA', 'Aprobada'],
    ['RECHAZADA', 'Rechazada'],
  ]

  it.each(cases)('labels %s as "%s"', (status, label) => {
    render(<EvidenceRequestBadge status={status} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })
})
