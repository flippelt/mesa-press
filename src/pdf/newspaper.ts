import { NEWSPAPER } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

function rules(doc: PDFDoc, x: number, y: number, w: number): void {
  doc.save()
  doc.strokeColor(NEWSPAPER.rule).lineWidth(1.4)
  doc
    .moveTo(x, y)
    .lineTo(x + w, y)
    .stroke()
  doc.lineWidth(0.35)
  doc
    .moveTo(x, y + 2.4)
    .lineTo(x + w, y + 2.4)
    .stroke()
  doc.restore()
}

export function drawNewspaper(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 8 : 10)
  const qrSize = mm(QR_MM)
  const footerReserve = mm(fm.qr ? 26 : 12)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(NEWSPAPER.paper)
    const innerX = margin
    const innerW = page.width - 2 * margin
    let y = margin + mm(compact ? 4 : 5)

    if (fm.eyebrow && !running) {
      doc.font(FONT.sansBold).fontSize(7).fillColor(NEWSPAPER.kicker)
      doc.text(fm.eyebrow.toUpperCase(), innerX, y, {
        width: innerW,
        align: 'center',
        characterSpacing: isAscii(fm.eyebrow) ? 1.8 : 0,
      })
      y += mm(5)
    }

    doc.font(FONT.serifBold).fontSize(compact ? 16 : 22).fillColor(NEWSPAPER.ink)
    doc.text(fm.title.toUpperCase(), innerX, y, { width: innerW, align: 'center' })
    y += compact ? mm(12) : mm(16)

    rules(doc, innerX, y, innerW)
    y += mm(5)

    if (!running) {
      const bits = [fm.from, fm.date, fm.to].filter(Boolean)
      if (bits.length) {
        doc.font(FONT.sans).fontSize(8).fillColor(NEWSPAPER.ink).fillOpacity(0.7)
        doc.text(bits.join('  ·  ').toUpperCase(), innerX, y, { width: innerW, align: 'center' })
        doc.fillOpacity(1)
        y += mm(6)
        rules(doc, innerX, y, innerW)
        y += mm(6)
      }
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
      color: NEWSPAPER.ink,
      align: 'left',
      paragraphSize: compact ? 8.5 : 10,
      headingSize: compact ? 11 : 12.5,
      lineHeight: 1.34,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = (page.width - qrSize) / 2
    const qy = page.height - margin - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: NEWSPAPER.ink, bg: NEWSPAPER.paper })
  }
}
