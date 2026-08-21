import { StyleSheet, Text, View } from '@react-pdf/renderer'

import { pdfColors } from '@/lib/pdf/pdfColors'

export interface PdfTableColumn {
  header: string
  /** Column width as a CSS-style percentage string, e.g. `'40%'`. Defaults to an even split. */
  width?: string
  align?: 'left' | 'right'
}

export interface PdfTableProps {
  columns: PdfTableColumn[]
  /** One array of cell strings per row, in the same order as `columns`. */
  rows: string[][]
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    backgroundColor: pdfColors.ink100,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.ink200,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.ink200,
  },
  headerCell: {
    padding: 6,
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: pdfColors.ink500,
    lineHeight: 1.3,
  },
  cell: { padding: 6, fontSize: 8, color: pdfColors.ink900 },
})

/**
 * A native (vector, selectable) table for report data too tabular and too
 * long to reasonably capture as a chart image — a teacher list, a
 * question-by-question breakdown. Rows are free to split across pages (each
 * row itself stays intact via `wrap={false}`); the header only appears once,
 * at the top — `@react-pdf/renderer` has no equivalent of an HTML `<thead>`
 * that reprints itself when an arbitrary table breaks across pages.
 *
 * @example
 * <PdfTable
 *   columns={[{ header: 'Docente', width: '50%' }, { header: 'Promedio', align: 'right' }]}
 *   rows={teachers.map((t) => [t.user.name, t.overall_average.toFixed(2)])}
 * />
 */
export function PdfTable({ columns, rows }: PdfTableProps) {
  const columnWidth = `${100 / columns.length}%`

  return (
    <View>
      <View style={styles.headerRow}>
        {columns.map((column) => (
          <Text
            key={column.header}
            style={[
              styles.headerCell,
              { width: column.width ?? columnWidth, textAlign: column.align ?? 'left' },
            ]}
          >
            {column.header}
          </Text>
        ))}
      </View>

      {rows.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row} wrap={false}>
          {row.map((cell, cellIndex) => (
            <Text
              key={columns[cellIndex]?.header ?? cellIndex}
              style={[
                styles.cell,
                {
                  width: columns[cellIndex]?.width ?? columnWidth,
                  textAlign: columns[cellIndex]?.align ?? 'left',
                },
              ]}
            >
              {cell}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}
