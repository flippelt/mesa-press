import { TELEGRAM } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

export function drawTelegram(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 7 : 9)
  const barH = mm(compact ? 9 : 11)
  const qrSize = mm(QR_MM)
  const footerReserve = mm(fm.qr ? 26 : 12)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(TELEGRAM.paper)
    doc.rect(0, 0, page.width, barH).fill(TELEGRAM.bar)
    doc.rect(0, page.height - mm(3.2), page.width, mm(3.2)).fill(TELEGRAM.bar)

    const head = (fm.eyebrow || 'telegrama').toUpperCase()
    doc.font(FONT.sansBold).fontSize(compact ? 9 : 11).fillColor(TELEGRAM.paper)
    doc.text(head, margin, mm(compact ? 2.6 : 3.2), {
      width: page.width - 2 * margin,
      align: 'center',
      characterSpacing: isAscii(head) ? 1.6 : 0,
    })

    const innerX = margin + mm(3)
    const innerW = page.width - innerX * 2
    let y = barH + mm(compact ? 5 : 6)

    if (!running) {
      const row = (label: string, value: string | undefined): void => {
        if (!value) return
        doc.font(FONT.sansBold).fontSize(7).fillColor(TELEGRAM.ink).fillOpacity(0.55)
        doc.text(label, innerX, y, { width: mm(18), lineBreak: false })
        doc.fillOpacity(1)
        doc.font(FONT.mono).fontSize(9).fillColor(TELEGRAM.ink)
        doc.text(value.toUpperCase(), innerX + mm(18), y - 0.6, {
          width: innerW - mm(18),
          lineBreak: false,
        })
        y += mm(5.5)
      }
      row('DE', fm.from)
      row('PARA', fm.to)
      row('EM', fm.date)
      if (fm.from || fm.to || fm.date) {
        doc.save()
        doc.strokeColor(TELEGRAM.ink).lineWidth(0.7)
        doc
          .moveTo(innerX, y)
          .lineTo(innerX + innerW, y)
          .stroke()
        doc.restore()
        y += mm(5)
      }
    }

    doc.font(FONT.sansBold).fontSize(compact ? 11 : 13).fillColor(TELEGRAM.ink)
    doc.text(fm.title, innerX, y, { width: innerW })
    y += compact ? mm(8) : mm(10)

    return { x: innerX, y, width: innerW, maxY: page.height - mm(5) - footerReserve }
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
      family: 'mono',
      color: TELEGRAM.ink,
      align: 'left',
      paragraphSize: compact ? 8.5 : 9.5,
      headingSize: compact ? 10 : 11,
      lineHeight: 1.34,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = page.width - margin - qrSize
    const qy = page.height - mm(6) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: TELEGRAM.ink, bg: TELEGRAM.paper })
  }
}
