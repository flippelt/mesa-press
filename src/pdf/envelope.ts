import { ENVELOPE } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { FONT } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'

function isAirmail(eyebrow?: string): boolean {
  return /a[eé]reo|air.?mail|par.?avion/i.test(eyebrow ?? '')
}

function airmailStripes(doc: PDFDoc, page: PageBox, inset: number): void {
  const colors = [ENVELOPE.stripeRed, ENVELOPE.stripeBlue]
  const step = mm(4.2)
  doc.save()
  let i = 0
  for (let x = inset; x < page.width - inset; x += step) {
    doc.fillColor(colors[i % 2] ?? ENVELOPE.stripeRed)
    doc.rect(x, inset, step * 0.72, mm(3.2)).fill()
    doc.rect(x, page.height - inset - mm(3.2), step * 0.72, mm(3.2)).fill()
    i++
  }
  for (let y = inset; y < page.height - inset; y += step) {
    doc.fillColor(colors[i % 2] ?? ENVELOPE.stripeBlue)
    doc.rect(inset, y, mm(3.2), step * 0.72).fill()
    doc.rect(page.width - inset - mm(3.2), y, mm(3.2), step * 0.72).fill()
    i++
  }
  doc.restore()
}

export function drawEnvelope(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 8 : 10)
  const air = isAirmail(fm.eyebrow)
  const qrSize = mm(compact ? 16 : QR_MM)

  doc.rect(0, 0, page.width, page.height).fill(ENVELOPE.paper)
  doc.save()
  doc.strokeColor(ENVELOPE.ink).opacity(0.35).lineWidth(0.7)
  doc.rect(mm(3), mm(3), page.width - mm(6), page.height - mm(6)).stroke()
  doc.restore()

  const flapH = mm(compact ? 28 : 36)
  doc.save()
  doc.fillColor(ENVELOPE.flap)
  doc
    .moveTo(mm(3), mm(3) + flapH)
    .lineTo(page.width / 2, mm(3) + mm(6))
    .lineTo(page.width - mm(3), mm(3) + flapH)
    .lineTo(page.width - mm(3), mm(3))
    .lineTo(mm(3), mm(3))
    .closePath()
    .fill()
  doc.strokeColor(ENVELOPE.ink).opacity(0.25).lineWidth(0.5)
  doc
    .moveTo(mm(3), mm(3) + flapH)
    .lineTo(page.width / 2, mm(3) + mm(6))
    .lineTo(page.width - mm(3), mm(3) + flapH)
    .stroke()
  doc.restore()

  if (air) airmailStripes(doc, page, mm(3))

  if (fm.from) {
    doc.font(FONT.letter).fontSize(compact ? 8 : 9).fillColor(ENVELOPE.ink)
    doc.text(fm.from, margin, mm(3) + flapH + mm(4), {
      width: page.width * 0.42,
    })
  }

  const toY = page.height * 0.46
  const addressee = fm.to ?? fm.title
  doc.font(FONT.letterItalic).fontSize(compact ? 12 : 14).fillColor(ENVELOPE.ink)
  doc.text(addressee, page.width * 0.28, toY, {
    width: page.width * 0.55,
  })
  if (fm.to && fm.title && fm.to !== fm.title) {
    doc.font(FONT.letter).fontSize(compact ? 9 : 10)
    doc.text(fm.title, page.width * 0.28, toY + mm(compact ? 14 : 16), {
      width: page.width * 0.55,
    })
  }

  const stampX = page.width - margin - mm(compact ? 22 : 26)
  const stampY = mm(3) + flapH + mm(3)
  const stampW = mm(compact ? 20 : 24)
  const stampH = mm(compact ? 24 : 28)
  doc.save()
  doc.strokeColor(ENVELOPE.stamp).lineWidth(1.1)
  doc.rect(stampX, stampY, stampW, stampH).stroke()
  doc.font(FONT.sansBold).fontSize(6).fillColor(ENVELOPE.stamp)
  doc.text((air ? 'AÉREO' : fm.eyebrow || 'SELO').toUpperCase(), stampX + mm(1), stampY + mm(3), {
    width: stampW - mm(2),
    align: 'center',
  })
  if (fm.date) {
    doc.font(FONT.sans).fontSize(6)
    doc.text(fm.date, stampX + mm(1), stampY + stampH - mm(8), {
      width: stampW - mm(2),
      align: 'center',
    })
  }
  doc.restore()

  if (fm.qr) {
    drawQr(doc, fm.qr, stampX + (stampW - qrSize) / 2, stampY + mm(7), Math.min(qrSize, stampW - mm(4)), {
      module: ENVELOPE.ink,
      bg: ENVELOPE.paper,
    })
  }
}
