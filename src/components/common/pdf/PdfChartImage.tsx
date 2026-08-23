import { Image, StyleSheet, View } from '@react-pdf/renderer'

export interface PdfChartImageProps {
  /** A PNG data URL from `captureChartImage`. */
  src: string
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  image: { width: '100%' },
})

/**
 * Embeds a chart captured by `captureChartImage` into a PDF page, scaled to
 * the available width with its aspect ratio preserved — react-pdf can't
 * render Recharts directly, so this is the vector-document's window onto a
 * raster snapshot of what's already on screen.
 *
 * @example
 * <PdfChartImage src={images.dimensions} />
 */
export function PdfChartImage({ src }: PdfChartImageProps) {
  return (
    <View style={styles.wrapper}>
      <Image src={src} style={styles.image} />
    </View>
  )
}
