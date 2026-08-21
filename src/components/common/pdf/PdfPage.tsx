import { Document, Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import type { ReactNode } from 'react'

import { pdfColors } from '@/lib/pdf/pdfColors'

export interface PdfPageProps {
  /** e.g. "Resumen del departamento (Sistemas)" */
  title: string
  /** e.g. "Periodo: 2024-2" */
  subtitle?: string
  children: ReactNode
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 72,
    paddingBottom: 36,
    paddingHorizontal: 32,
    fontSize: 10,
    color: pdfColors.ink900,
  },
  header: {
    position: 'absolute',
    top: 24,
    left: 32,
    right: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: pdfColors.ink200,
    paddingBottom: 10,
  },
  logo: { width: 30, height: 30 },
  headerText: { flexGrow: 1 },
  eyebrow: {
    fontSize: 7,
    color: pdfColors.ink500,
    textTransform: 'uppercase',
  },
  title: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: pdfColors.ink900, marginTop: 2 },
  subtitle: { fontSize: 9, color: pdfColors.ink700, marginTop: 1 },
  generatedAt: { fontSize: 7, color: pdfColors.ink500 },
  footer: {
    position: 'absolute',
    bottom: 16,
    left: 32,
    right: 32,
    textAlign: 'center',
    fontSize: 7,
    color: pdfColors.ink500,
  },
})

/**
 * A single-page-template `<Document>` for downloadable reports: a letterhead
 * (institution logo, report title, generation date) and a page-number
 * footer, both marked `fixed` so `@react-pdf/renderer` repeats them natively
 * on every physical page — the one thing the old `window.print()` path could
 * never reliably do (see `PrintPage`, now removed). Content goes between
 * them; wrap sections in `<View wrap={false}>` (see `PdfSection`) to keep a
 * card from splitting across a page break.
 *
 * @example
 * <PdfPage title="Resumen del departamento (Sistemas)" subtitle="Periodo: 2024-2">
 *   <PdfFactGrid facts={facts} />
 *   <PdfSection title="Evolución del promedio">...</PdfSection>
 * </PdfPage>
 */
export function PdfPage({ title, subtitle, children }: PdfPageProps) {
  const generatedAt = new Date().toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          <Image src="/logo.png" style={styles.logo} />

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>
              Universidad Francisco de Paula Santander — Evaluación Docente
            </Text>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          <Text style={styles.generatedAt}>Generado el {generatedAt}</Text>
        </View>

        {children}

        <Text
          style={styles.footer}
          fixed
          render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
        />
      </Page>
    </Document>
  )
}
