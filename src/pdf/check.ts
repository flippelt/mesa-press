import { CHECK } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { FONT } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, type PageBox } from './sizes.js'
import { wrapSpans } from './text.js'

export function drawCheck(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const pad = mm(compact ? 6 : 8)
  const boxW = page.width - 2 * pad
  const boxH = mm(compact ? 58 : 72)
  const x = pad
  const y = (page.height - boxH) / 2
  const qrSize = mm(compact ? 14 : 16)

  doc.rect(0, 0, page.width, page.height).fill('#f3f4f1')
  doc.save()
  doc.translate(1.4, 1.8)
  doc.fillColor('#1a2218').fillOpacity(0.12)
  doc.rect(x, y, boxW, boxH).fill()
  doc.restore()
  doc.rect(x, y, boxW, boxH).fill(CHECK.paper)
  doc.save()
  doc.strokeColor(CHECK.ink).lineWidth(1.3)
  doc.rect(x, y, boxW, boxH).stroke()
  doc.lineWidth(0.4)
  doc.rect(x + 2.2, y + 2.2, boxW - 4.4, boxH - 4.4).stroke()
  doc.restore()

  doc.save()
  doc.strokeColor(CHECK.line).lineWidth(0.35)
  for (let ly = y + mm(14); ly < y + boxH - mm(4); ly += mm(3.6)) {
    doc
      .moveTo(x + mm(3), ly)
      .lineTo(x + boxW - mm(3), ly)
      .stroke()
  }
  doc.restore()

  let cy = y + mm(4)
  doc.font(FONT.letterItalic).fontSize(7).fillColor(CHECK.ink)
  if (fm.from) doc.text(fm.from, x + mm(4), cy, { width: boxW * 0.55, lineBreak: false })
  if (fm.date) {
    doc.font(FONT.letter).fontSize(8)
    doc.text(fm.date, x + boxW * 0.58, cy, { width: boxW * 0.38, align: 'right' })
  }
  cy += mm(7)

  doc.font(FONT.newsBold).fontSize(compact ? 11 : 13).fillColor(CHECK.bank)
  doc.text(fm.title.toUpperCase(), x + mm(4), cy, {
    width: boxW - mm(8),
    align: 'center',
    lineBreak: false,
  })
  cy += mm(8)

  doc.font(FONT.letterItalic).fontSize(8).fillColor(CHECK.ink)
  doc.text('Pague a', x + mm(4), cy, { lineBreak: false })
  doc.save()
  doc.strokeColor(CHECK.rule).lineWidth(0.6)
  doc
    .moveTo(x + mm(16), cy + mm(4.2))
    .lineTo(x + boxW - mm(compact ? 28 : 34), cy + mm(4.2))
    .stroke()
  doc.restore()
  if (fm.to) {
    doc.font(FONT.script).fontSize(compact ? 13 : 15).fillColor(CHECK.ink)
    doc.text(fm.to, x + mm(17), cy - mm(1), {
      width: boxW - mm(compact ? 48 : 54),
      lineBreak: false,
    })
  }
  if (fm.eyebrow) {
    doc.font(FONT.newsBold).fontSize(11).fillColor(CHECK.ink)
    doc.text(fm.eyebrow, x + boxW - mm(compact ? 26 : 32), cy, {
      width: mm(compact ? 22 : 28),
      align: 'right',
      lineBreak: false,
    })
  }
  cy += mm(10)

  const memo = prop.body.replace(/\s+/g, ' ').trim()
  if (memo) {
    doc.font(FONT.script).fontSize(compact ? 11 : 12).fillColor(CHECK.ink)
    const lines = wrapSpans(doc, [{ text: memo, italic: true }], boxW - mm(20), 'script', compact ? 11 : 12)
    const first = lines[0]
    if (first) {
      doc.font(FONT.script).fontSize(compact ? 11 : 12)
      let cursor = x + mm(4)
      for (const span of first.spans) {
        doc.text(span.text, cursor, cy, { lineBreak: false, continued: false })
        cursor += doc.widthOfString(span.text)
      }
    }
    doc.save()
    doc.strokeColor(CHECK.rule).lineWidth(0.5)
    doc
      .moveTo(x + mm(4), cy + mm(5))
      .lineTo(x + boxW - mm(28), cy + mm(5))
      .stroke()
    doc.restore()
    doc.font(FONT.letterItalic).fontSize(7)
    doc.text('moeda', x + boxW - mm(26), cy + mm(1.5), { width: mm(22), align: 'right' })
  }
  cy += mm(12)

  doc.font(FONT.letter).fontSize(7).fillColor(CHECK.ink).fillOpacity(0.7)
  doc.text('Assinatura', x + boxW * 0.48, cy, { lineBreak: false })
  doc.fillOpacity(1)
  doc.save()
  doc.strokeColor(CHECK.rule).lineWidth(0.5)
  doc
    .moveTo(x + boxW * 0.48, cy + mm(8))
    .lineTo(x + boxW - mm(6), cy + mm(8))
    .stroke()
  doc.restore()
  if (fm.from) {
    doc.font(FONT.script).fontSize(compact ? 13 : 15).fillColor(CHECK.ink)
    doc.text(fm.from, x + boxW * 0.48, cy + mm(1), {
      width: boxW * 0.46,
      lineBreak: false,
    })
  }

  if (fm.qr) {
    drawQr(doc, fm.qr, x + mm(4), y + boxH - mm(5) - qrSize, qrSize, {
      module: CHECK.ink,
      bg: CHECK.paper,
    })
  }
}
