import { createRequire } from 'node:module'
import type { PDFDoc } from './pdfkit.js'

const require = createRequire(import.meta.url)
const loaded = require('qrcode') as typeof import('qrcode') | { default: typeof import('qrcode') }
const QRCode = ('default' in loaded ? loaded.default : loaded) as typeof import('qrcode')

export function drawQr(
  doc: PDFDoc,
  payload: string,
  x: number,
  y: number,
  size: number,
  colors: { module: string; bg?: string },
): void {
  const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' })
  const n = qr.modules.size
  const cell = size / n
  doc.save()
  if (colors.bg) {
    doc.rect(x, y, size, size).fill(colors.bg)
  }
  doc.fillColor(colors.module)
  for (let row = 0; row < n; row += 1) {
    for (let col = 0; col < n; col += 1) {
      if (qr.modules.get(row, col)) {
        doc.rect(x + col * cell, y + row * cell, cell + 0.15, cell + 0.15).fill()
      }
    }
  }
  doc.restore()
}
