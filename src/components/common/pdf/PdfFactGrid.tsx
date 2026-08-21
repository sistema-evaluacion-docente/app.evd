import { StyleSheet, Text, View } from '@react-pdf/renderer'

import { pdfColors } from '@/lib/pdf/pdfColors'

export interface PdfFactEntry {
  /** Also used as the React key — must be unique within one grid. */
  label: string
  value: string
  /** Overrides the value's color, e.g. a risk-level red. */
  color?: string
}

export interface PdfFactGridProps {
  facts: PdfFactEntry[]
  /** How many facts per row. Defaults to 3. */
  columns?: number
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: pdfColors.ink200,
    borderRadius: 4,
  },
  cell: { padding: 10, borderColor: pdfColors.ink200 },
  label: {
    fontSize: 7,
    color: pdfColors.ink500,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  value: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: pdfColors.ink900 },
})

/**
 * A row of label+value stat tiles — the PDF equivalent of the `Fact` grid in
 * `DepartmentStatsHero`, including its bordered-card-with-dividers look
 * (`divide-x`/`divide-y` on screen): an outer border plus a hairline between
 * cells, so the grouping reads as a table instead of loose floating text.
 * Pure text, rendered natively (vector, selectable), not captured as an
 * image like the charts are.
 *
 * @example
 * <PdfFactGrid
 *   facts={[
 *     { label: 'Promedio general', value: '4.69' },
 *     { label: 'Comentarios de riesgo alto', value: '0', color: pdfColors.riskHigh },
 *   ]}
 * />
 */
export function PdfFactGrid({ facts, columns = 3 }: PdfFactGridProps) {
  const width = `${100 / columns}%`

  return (
    <View style={styles.grid}>
      {facts.map((fact, index) => (
        <View
          key={fact.label}
          style={[
            styles.cell,
            { width },
            index % columns !== 0 ? { borderLeftWidth: 1 } : {},
            index >= columns ? { borderTopWidth: 1 } : {},
          ]}
        >
          <Text style={styles.label}>{fact.label}</Text>
          <Text style={[styles.value, fact.color ? { color: fact.color } : {}]}>{fact.value}</Text>
        </View>
      ))}
    </View>
  )
}
