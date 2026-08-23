import { StyleSheet, Text, View } from '@react-pdf/renderer'

import { pdfColors } from '@/lib/pdf/pdfColors'

export interface PdfCommentEntry {
  text: string
  riskLabel?: string
  riskColor?: string
  categoryLabels?: string[]
}

export interface PdfCommentListProps {
  comments: PdfCommentEntry[]
  emptyMessage?: string
}

const styles = StyleSheet.create({
  comment: {
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.ink200,
    paddingVertical: 8,
  },
  text: { fontSize: 9, color: pdfColors.ink900, lineHeight: 1.4 },
  meta: { flexDirection: 'row', gap: 10, marginTop: 4 },
  tag: { fontSize: 7, color: pdfColors.ink500 },
  empty: { fontSize: 9, color: pdfColors.ink500, textAlign: 'center', paddingVertical: 12 },
})

/**
 * Full comment text, unlike the risk/category count grids the reports
 * otherwise use — for the one report scoped to a single subject, where the
 * volume is small enough that the actual student feedback is worth
 * including rather than just its classification counts. Each entry stays
 * intact on one page (`wrap={false}`) so a comment never splits mid-sentence
 * across a break.
 *
 * @example
 * <PdfCommentList
 *   comments={comments.map((c) => ({
 *     text: c.original_text,
 *     riskLabel: c.risk_level?.name,
 *     riskColor: pdfColors.riskLow,
 *     categoryLabels: c.pedagogical_categories.map((cat) => categoryLabel(cat.name)),
 *   }))}
 * />
 */
export function PdfCommentList({
  comments,
  emptyMessage = 'No hay comentarios registrados.',
}: PdfCommentListProps) {
  if (comments.length === 0) {
    return <Text style={styles.empty}>{emptyMessage}</Text>
  }

  return (
    <View>
      {comments.map((comment, index) => (
        <View key={index} style={styles.comment} wrap={false}>
          <Text style={styles.text}>{comment.text}</Text>

          {(comment.riskLabel || (comment.categoryLabels && comment.categoryLabels.length > 0)) && (
            <View style={styles.meta}>
              {comment.riskLabel && (
                <Text style={[styles.tag, comment.riskColor ? { color: comment.riskColor } : {}]}>
                  Riesgo: {comment.riskLabel}
                </Text>
              )}

              {comment.categoryLabels && comment.categoryLabels.length > 0 && (
                <Text style={styles.tag}>{comment.categoryLabels.join(', ')}</Text>
              )}
            </View>
          )}
        </View>
      ))}
    </View>
  )
}
