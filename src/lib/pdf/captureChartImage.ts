import { toPng } from 'html-to-image'

/**
 * Snapshots a DOM node — a chart card, legend and all — as a PNG data URL,
 * for embedding in a `@react-pdf/renderer` document via `<Image>`.
 *
 * Captures the node exactly as it's already painted on screen at that
 * instant (its real on-screen size, not one recalculated for print): it
 * clones the subtree, inlines the already-computed styles, serializes it to
 * SVG, and draws that onto a hidden canvas. Nothing about the node's layout
 * changes to do this, so there's no resize for Recharts' `ResizeObserver` to
 * miss — the chart charts were already correctly sized before this runs.
 * `pixelRatio: 2` keeps the embedded image sharp once react-pdf scales it
 * down to fit the report's page width.
 *
 * @example
 * const png = await captureChartImage(cardRef.current)
 */
export function captureChartImage(node: HTMLElement) {
  return toPng(node, { backgroundColor: '#ffffff', pixelRatio: 2 })
}
