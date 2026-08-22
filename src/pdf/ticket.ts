import { TICKET } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

function dashes(doc: PDFDoc, x: number, y0: number, y1: number): void {
  doc.save()
  doc.strokeColor(TICKET.dash).lineWidth(0.8).dash(3.2, { space: 2.4 })
  doc
    .moveTo(x, y0)
    .lineTo(x, y1)
    .stroke()
  doc.undash()
  doc.restore()
}

export function drawTicket(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const stubW = mm(compact ? 24 : 28)
  const qrSize = mm(compact ? 16 : QR_MM)
  const margin = mm(compact ? 6 : 8)
  const footerReserve = mm(10)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(TICKET.paper)
    doc.rect(0, 0, stubW, page.height).fill(TICKET.stub)
    dashes(doc, stubW, mm(4), page.height - mm(4))

    doc.save()
    doc.strokeColor(TICKET.accent).lineWidth(2.2)
    doc.rect(mm(2.4), mm(2.4), page.width - mm(4.8), page.height - mm(4.8)).stroke()
    doc.restore()

    if (!running) {
      doc.save()
      doc.rotate(-90, { origin: [stubW / 2, page.height / 2] })
      const label = (fm.eyebrow || 'passagem').toUpperCase()
      doc.font(FONT.sansBold).fontSize(compact ? 8 : 9).fillColor(TICKET.accent)
      doc.text(label, stubW / 2 - mm(40), page.height / 2 - mm(3), {
        width: mm(80),
        align: 'center',
      })
      doc.restore()
    }

    const innerX = stubW + mm(compact ? 6 : 8)
    const innerW = page.width - innerX - margin
    let y = margin + mm(compact ? 6 : 8)

    doc.font(FONT.sansBold).fontSize(compact ? 12 : 15).fillColor(TICKET.ink)
    doc.text(fm.title, innerX, y, { width: innerW })
    y += compact ? mm(9) : mm(11)

    if (!running && (fm.from || fm.to)) {
      doc.font(FONT.sans).fontSize(8).fillColor(TICKET.ink).fillOpacity(0.6)
      doc.text('DE', innerX, y, { width: innerW * 0.42 })
      doc.text('PARA', innerX + innerW * 0.5, y, { width: innerW * 0.5 })
      doc.fillOpacity(1)
      y += mm(4.5)
      doc.font(FONT.sansBold).fontSize(compact ? 10 : 11).fillColor(TICKET.ink)
      doc.text(fm.from || '—', innerX, y, { width: innerW * 0.42 })
      doc.text(fm.to || '—', innerX + innerW * 0.5, y, { width: innerW * 0.5 })
      y += mm(8)
    }

    if (!running && fm.date) {
      doc.font(FONT.mono).fontSize(8).fillColor(TICKET.accent)
      doc.text(fm.date, innerX, y, { width: innerW })
      y += mm(6)
    }

    doc.save()
    doc.strokeColor(TICKET.dash).lineWidth(0.5).dash(2, { space: 2 })
    doc
      .moveTo(innerX, y)
      .lineTo(innerX + innerW, y)
      .stroke()
    doc.undash()
    doc.restore()
    y += mm(5)

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
      family: 'sans',
      color: TICKET.ink,
      align: 'left',
      paragraphSize: compact ? 8.5 : 9.5,
      headingSize: compact ? 10 : 11.5,
      lineHeight: 1.3,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = (stubW - qrSize) / 2
    const qy = page.height - margin - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: TICKET.ink, bg: TICKET.stub })
  }
}
