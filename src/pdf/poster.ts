import { POSTER } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

function stain(doc: PDFDoc, page: PageBox): void {
  doc.save()
  doc.fillColor(POSTER.stain).fillOpacity(0.12)
  doc.circle(mm(14), mm(18), mm(page.name === 'a6' ? 18 : 24)).fill()
  doc.fillOpacity(0.1)
  doc.circle(page.width - mm(12), page.height - mm(22), mm(page.name === 'a6' ? 20 : 28)).fill()
  doc.restore()
}

function woodcutFrame(doc: PDFDoc, page: PageBox, margin: number): void {
  const w = page.width - 2 * margin
  const h = page.height - 2 * margin
  doc.save()
  doc.strokeColor(POSTER.ink)
  doc.lineWidth(2.8)
  doc.rect(margin, margin, w, h).stroke()
  doc.lineWidth(0.7)
  const gap = mm(2.4)
  doc.rect(margin + gap, margin + gap, w - 2 * gap, h - 2 * gap).stroke()

  const tick = mm(5)
  const inset = margin + gap
  doc.lineWidth(1.4)
  const corners: Array<[number, number, number, number, number, number]> = [
    [inset, inset + tick, inset, inset, inset + tick, inset],
    [page.width - inset - tick, inset, page.width - inset, inset, page.width - inset, inset + tick],
    [inset, page.height - inset - tick, inset, page.height - inset, inset + tick, page.height - inset],
    [
      page.width - inset - tick,
      page.height - inset,
      page.width - inset,
      page.height - inset,
      page.width - inset,
      page.height - inset - tick,
    ],
  ]
  for (const [x1, y1, x2, y2, x3, y3] of corners) {
    doc.moveTo(x1, y1).lineTo(x2, y2).lineTo(x3, y3).stroke()
  }
  doc.restore()
}

export function drawPoster(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 7 : 9)
  const innerX = margin + mm(8)
  const innerW = page.width - innerX * 2
  const qrSize = mm(QR_MM)
  const footerReserve = mm(fm.qr ? 30 : 18)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(POSTER.paper)
    stain(doc, page)
    woodcutFrame(doc, page, margin)
    let y = margin + mm(compact ? 8 : 11)

    if (fm.eyebrow && !running) {
      const eyebrow = fm.eyebrow.toUpperCase()
      doc.font(FONT.sansBold).fontSize(compact ? 8 : 10).fillColor(POSTER.kicker)
      doc.text(eyebrow, innerX, y, {
        width: innerW,
        align: 'center',
        characterSpacing: isAscii(eyebrow) ? 2.8 : 0,
      })
      y += mm(compact ? 6 : 8)
    }

    const titleSize = compact ? 18 : running ? 14 : 28
    doc.font(FONT.serifBold).fontSize(titleSize)
    const titleOpts = { width: innerW, align: 'center' as const }
    const titleH = doc.heightOfString(fm.title.toUpperCase(), titleOpts)
    doc.fillColor(POSTER.ink).fillOpacity(0.18)
    doc.text(fm.title.toUpperCase(), innerX + 0.8, y + 0.8, titleOpts)
    doc.fillOpacity(1).fillColor(POSTER.ink)
    doc.text(fm.title.toUpperCase(), innerX, y, titleOpts)
    y += titleH + mm(3)

    doc.save()
    doc.strokeColor(POSTER.ink).lineWidth(1.1)
    const rulePad = innerW * 0.12
    doc
      .moveTo(innerX + rulePad, y)
      .lineTo(innerX + innerW - rulePad, y)
      .stroke()
    doc.lineWidth(0.4)
    doc
      .moveTo(innerX + rulePad, y + 2.2)
      .lineTo(innerX + innerW - rulePad, y + 2.2)
      .stroke()
    doc.restore()
    y += mm(6)

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
      color: POSTER.ink,
      align: 'center',
      paragraphSize: compact ? 9 : 11,
      headingSize: compact ? 12 : 14,
      lineHeight: 1.36,
    },
    onNewPage,
  )

  const footY = page.height - margin - mm(fm.qr ? 8 + QR_MM : 8)
  doc.save()
  doc.strokeColor(POSTER.ink).lineWidth(0.6)
  doc
    .moveTo(innerX + innerW * 0.15, footY)
    .lineTo(innerX + innerW * 0.85, footY)
    .stroke()
  doc.restore()
  if (fm.date) {
    const date = fm.date.toUpperCase()
    doc.font(FONT.sans).fontSize(7).fillColor(POSTER.ink).fillOpacity(0.75)
    doc.text(date, innerX, footY + mm(2), {
      width: innerW,
      align: 'center',
      characterSpacing: isAscii(date) ? 1.1 : 0,
    })
    doc.fillOpacity(1)
  }

  if (fm.qr) {
    const qx = (page.width - qrSize) / 2
    const qy = page.height - margin - mm(5) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: POSTER.ink, bg: POSTER.paper })
  }
}
