import { EDICT } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { drawWaxSeal, waxPalette } from './seal.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { drawDiamond, flowBlocks, type FlowBox } from './text.js'

function frame(doc: PDFDoc, page: PageBox, margin: number): void {
  const w = page.width - 2 * margin
  const h = page.height - 2 * margin
  doc.save()
  doc.strokeColor(EDICT.gold).lineWidth(2.2)
  doc.rect(margin, margin, w, h).stroke()
  doc.lineWidth(0.5)
  const gap = mm(2.6)
  doc.rect(margin + gap, margin + gap, w - 2 * gap, h - 2 * gap).stroke()
  const d = 2.4
  const spots: Array<[number, number]> = [
    [margin + gap, margin + gap],
    [margin + w - gap, margin + gap],
    [margin + gap, margin + h - gap],
    [margin + w - gap, margin + h - gap],
  ]
  for (const [x, y] of spots) drawDiamond(doc, x, y, d, EDICT.gold)
  doc.restore()
}

export function drawEdict(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 8 : 10)
  const qrSize = mm(QR_MM)
  const palette = waxPalette(fm.seal)
  const footerReserve = mm(fm.qr || palette ? 30 : 16)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(EDICT.bg)
    frame(doc, page, margin)

    const innerX = margin + mm(9)
    const innerW = page.width - innerX * 2
    let y = margin + mm(compact ? 10 : 12)

    const kicker = (fm.eyebrow || 'por decreto').toUpperCase()
    if (!running) {
      doc.font(FONT.serifBold).fontSize(compact ? 8 : 9).fillColor(EDICT.gold)
      doc.text(kicker, innerX, y, {
        width: innerW,
        align: 'center',
        characterSpacing: isAscii(kicker) ? 2 : 0,
      })
      y += mm(7)
    }

    doc.font(FONT.serifBold).fontSize(compact ? 14 : 18).fillColor(EDICT.ink)
    doc.text(fm.title, innerX, y, { width: innerW, align: 'center' })
    y += compact ? mm(10) : mm(12)

    doc.save()
    doc.strokeColor(EDICT.gold).lineWidth(0.6)
    const mid = innerX + innerW / 2
    doc
      .moveTo(innerX + mm(8), y)
      .lineTo(mid - mm(4), y)
      .stroke()
    doc
      .moveTo(mid + mm(4), y)
      .lineTo(innerX + innerW - mm(8), y)
      .stroke()
    doc.restore()
    drawDiamond(doc, mid, y, 2.2, EDICT.gold)
    y += mm(7)

    if (!running && fm.date) {
      doc.font(FONT.serifItalic).fontSize(9).fillColor(EDICT.ink).fillOpacity(0.75)
      doc.text(fm.date, innerX, y, { width: innerW, align: 'center' })
      doc.fillOpacity(1)
      y += mm(7)
    }

    return { x: innerX, y, width: innerW, maxY: page.height - margin - footerReserve }
  }

  let box = paint(false)
  const onNewPage = (): Pick<FlowBox, 'y' | 'maxY'> => {
    addSameSizePage(doc, page.width, page.height)
    box = paint(true)
    return { y: box.y, maxY: box.maxY }
  }

  flowBlocks(
    doc,
    prop.blocks,
    box,
    {
      family: 'serif',
      color: EDICT.ink,
      align: 'center',
      paragraphSize: compact ? 9.5 : 11,
      headingSize: compact ? 12 : 13.5,
      lineHeight: 1.4,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = margin + mm(6)
    const qy = page.height - margin - mm(6) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: EDICT.ink, bg: EDICT.bg })
  }

  if (palette) {
    const r = mm(compact ? 8 : 9.5)
    const cx = page.width - margin - mm(8) - r
    const cy = page.height - margin - mm(8) - r
    drawWaxSeal(doc, cx, cy, r, palette)
  }
}
