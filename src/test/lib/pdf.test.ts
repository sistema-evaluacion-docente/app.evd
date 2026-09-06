import { describe, expect, it, vi } from 'vitest'

vi.mock('html-to-image', () => ({ toPng: vi.fn().mockResolvedValue('data:image/png;base64,abc') }))

import { toPng } from 'html-to-image'

import { captureChartImage } from '@/lib/pdf/captureChartImage'
import { formatPdfAverage } from '@/lib/pdf/formatPdfAverage'
import { pdfColors, pdfRiskColor } from '@/lib/pdf/pdfColors'

describe('captureChartImage', () => {
  it('snapshots the node as a PNG data URL, forcing a white background', async () => {
    const node = document.createElement('div')

    await captureChartImage(node)

    expect(toPng).toHaveBeenCalledWith(node, { backgroundColor: '#ffffff', pixelRatio: 2 })
  })
})

describe('formatPdfAverage', () => {
  it('formats a score with two decimals by default', () => {
    expect(formatPdfAverage(4.6957)).toBe('4.70')
  })

  it('respects a custom decimal count', () => {
    expect(formatPdfAverage(4.6957, 1)).toBe('4.7')
  })

  it('falls back to an em dash for null or undefined', () => {
    expect(formatPdfAverage(null)).toBe('—')
    expect(formatPdfAverage(undefined)).toBe('—')
  })
})

describe('pdfColors / pdfRiskColor', () => {
  it('shares the risk semaphore with the screen charts', () => {
    expect(pdfColors.riskLow).toBe('#22c55e')
    expect(pdfColors.riskMedium).toBe('#f59e0b')
    expect(pdfColors.riskHigh).toBe('#ef4444')
  })

  it('resolves a comment risk name to its semaphore color', () => {
    expect(pdfRiskColor('ALTO')).toBe('#ef4444')
    expect(pdfRiskColor(undefined)).toBeUndefined()
  })
})
