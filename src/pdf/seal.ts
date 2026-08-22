import { WAX, type WaxPalette } from '../tokens.js'
import type { SealName } from '../types.js'
import type { PDFDoc } from './pdfkit.js'

function star(doc: PDFDoc, cx: number, cy: number, r: number): void {
  const pts: Array<[number, number]> = []
  for (let i = 0; i < 5; i += 1) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r])
  }
  doc.moveTo(pts[0]![0], pts[0]![1])
  for (const i of [2, 4, 1, 3]) {
    doc.lineTo(pts[i]![0], pts[i]![1])
  }
  doc.closePath()
}

export function drawWaxSeal(
  doc: PDFDoc,
  cx: number,
  cy: number,
  radius: number,
  palette: WaxPalette,
): void {
  doc.save()
  doc.fillColor(palette.dark)
  doc.circle(cx - radius * 0.08, cy + radius * 0.06, radius).fill()
  doc.fillColor(palette.fill)
  doc.circle(cx + radius * 0.05, cy - radius * 0.04, radius * 0.98).fill()
  doc.circle(cx, cy, radius * 0.9).fill()
  doc.fillOpacity(0.35)
  doc.fillColor(palette.highlight)
  doc.circle(cx - radius * 0.28, cy - radius * 0.32, radius * 0.42).fill()
  doc.fillOpacity(1)
  doc.strokeColor(palette.dark).lineWidth(radius * 0.045)
  doc.circle(cx, cy, radius * 0.68).stroke()
  doc.lineWidth(radius * 0.02)
  doc.circle(cx, cy, radius * 0.78).stroke()
  doc.fillColor(palette.dark)
  star(doc, cx, cy, radius * 0.32)
  doc.fill()
  doc.restore()
}

export function waxPalette(seal: SealName): WaxPalette | null {
  if (seal === 'none') return null
  return WAX[seal]
}
