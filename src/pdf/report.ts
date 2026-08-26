import { REPORT } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

function confidentialStamp(doc: PDFDoc, text: string, x: number, y: number, w: number): void {
  doc.save()
  doc.rotate(-6, { origin: [x + w / 2, y + mm(4)] })
  doc.strokeColor(REPORT.stamp).opacity(0.8).lineWidth(1.5)
  doc.rect(x, y, w, mm(9)).stroke()
  doc.font(FONT.sansBold).fontSize(11).fillColor(REPORT.stamp).fillOpacity(0.85)
  doc.text(text.toUpperCase(), x, y + mm(2.2), {
    width: w,
    align: 'center',
    lineBreak: false,
    characterSpacing: isAscii(text) ? 1.6 : 0,
  })
  doc.restore()
}

export function drawReport(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 10 : 14)
  const qrSize = mm(compact ? 16 : QR_MM)
  const footerReserve = mm(fm.qr ? 26 : 14)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(REPORT.paper)
    doc.save()
    doc.fillColor(REPORT.hole)
    const holeY = mm(7)
    doc.circle(page.width / 2 - mm(12), holeY, mm(2.2)).fill()
    doc.circle(page.width / 2 + mm(12), holeY, mm(2.2)).fill()
    doc.fillColor('#efe6d4')
    doc.circle(page.width / 2 - mm(12), holeY, mm(1.1)).fill()
    doc.circle(page.width / 2 + mm(12), holeY, mm(1.1)).fill()
    doc.restore()

    let y = mm(compact ? 14 : 16)
    if (!running) {
      confidentialStamp(
        doc,
        fm.eyebrow || 'CONFIDENCIAL',
        page.width / 2 - mm(32),
        y,
        mm(64),
      )
      y += mm(14)
    }

    doc.font(FONT.typewriter).fontSize(compact ? 11 : 13).fillColor(REPORT.ink)
    doc.text(fm.title.toUpperCase(), margin, y, {
      width: page.width - 2 * margin,
      align: 'center',
    })
    y += mm(compact ? 10 : 12)

    if (!running) {
      const bits = [
        fm.from ? `ORIGEM: ${fm.from}` : '',
        fm.to ? `DESTINO: ${fm.to}` : '',
        fm.date ? `DATA: ${fm.date}` : '',
      ].filter(Boolean)
      if (bits.length) {
        doc.font(FONT.typewriter).fontSize(7.5).fillColor(REPORT.ink)
        doc.text(bits.join('    '), margin, y, { width: page.width - 2 * margin, align: 'center' })
        y += mm(6)
      }
      doc.save()
      doc.strokeColor(REPORT.rule).lineWidth(0.6)
      doc
        .moveTo(margin, y)
        .lineTo(page.width - margin, y)
        .stroke()
      doc.restore()
      y += mm(5)
    }

    return { x: margin, y, width: page.width - 2 * margin, maxY: page.height - margin - footerReserve }
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
      family: 'typewriter',
      color: REPORT.ink,
      align: 'left',
      paragraphSize: compact ? 8.5 : 9.5,
      headingSize: compact ? 10 : 11,
      lineHeight: 1.4,
    },
    onNewPage,
  )

  if (fm.from) {
    doc.font(FONT.script).fontSize(compact ? 14 : 16).fillColor(REPORT.ink)
    doc.text(fm.from, margin, page.height - margin - footerReserve + mm(2), {
      width: page.width * 0.5,
      lineBreak: false,
    })
  }

  if (fm.qr) {
    const qx = page.width - margin - qrSize
    const qy = page.height - margin - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: REPORT.ink, bg: REPORT.paper })
  }
}
