import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { PercentMeter } from '@/components/common/PercentMeter'

describe('PercentMeter', () => {
  it('renders nothing when value is missing', () => {
    const { container } = render(<PercentMeter value={null} label="Riesgo" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when value is undefined', () => {
    const { container } = render(<PercentMeter label="Riesgo" />)

    expect(container).toBeEmptyDOMElement()
  })

  it('normalizes a 0-1 ratio into a whole percentage', () => {
    render(<PercentMeter value={0.82} label="Probabilidad de acierto" />)

    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('normalizes a 0-100 value into a whole percentage', () => {
    render(<PercentMeter value={82} label="Probabilidad de acierto" />)

    expect(screen.getByText('82%')).toBeInTheDocument()
  })

  it('exposes the label and percentage as an accessible name', () => {
    render(<PercentMeter value={0.82} label="Probabilidad de acierto" />)

    expect(screen.getByRole('img', { name: 'Probabilidad de acierto: 82%' })).toBeInTheDocument()
  })

  it('renders the hairline bar by default', () => {
    const { container } = render(<PercentMeter value={0.5} label="Riesgo" />)

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('hides the bar when showBar is false', () => {
    const { container } = render(<PercentMeter value={0.5} label="Riesgo" showBar={false} />)

    expect(container.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })
})
