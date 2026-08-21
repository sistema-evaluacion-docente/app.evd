import { StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'

import { pdfColors } from '@/lib/pdf/pdfColors'

export interface PdfSectionProps {
  title: string
  /**
   * Keeps the card on one page instead of letting it split mid-content.
   * Defaults to `true` — right for a chart image or a short fact block, but
   * wrong for a section that can run to many pages (a long teacher list): a
   * `wrap={false}` block that doesn't fit the remaining page height still
   * gets pushed whole onto the next page, so a body taller than one full
   * page would never render at all. Set `false` for those.
   */
  noBreak?: boolean
  children: ReactNode
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderColor: pdfColors.ink200,
    borderRadius: 4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  header: {
    backgroundColor: pdfColors.brandTint,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.ink200,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  title: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: pdfColors.brand700 },
  body: { padding: 12 },
})

/**
 * Bordered card with a header row — the PDF equivalent of the
 * `rounded-md border` `<section>`s used on screen. `wrap={false}` keeps the
 * whole card on one page instead of letting it split mid-content; this is a
 * native `@react-pdf/renderer` behavior, not the `break-inside-avoid` CSS
 * hack the old print-based reports depended on (and which never fully
 * worked).
 *
 * @example
 * <PdfSection title="Promedios por dimensión pedagógica">
 *   <PdfChartImage src={dimensionsChartPng} />
 * </PdfSection>
 */
export function PdfSection({ title, noBreak = true, children }: PdfSectionProps) {
  return (
    <View style={styles.section} wrap={!noBreak}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.body}>{children}</View>
    </View>
  )
}
