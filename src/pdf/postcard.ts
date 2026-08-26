import { POSTCARD } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

export function drawPostcard(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 7 : 9)
  const qrSize = mm(compact ? 14 : 18)
  const split = page.width * 0.58

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(POSTCARD.paper)
    doc.save()
    doc.strokeColor(POSTCARD.ink).opacity(0.35).lineWidth(0.8)
    doc.rect(mm(3), mm(3), page.width - mm(6), page.height - mm(6)).stroke()
    doc.restore()

    if (!running) {
      doc.font(FONT.script).fontSize(compact ? 20 : 26).fillColor(POSTCARD.ink)
      doc.text(fm.title, margin, margin, {
        width: page.width - 2 * margin,
        align: 'center',
        lineBreak: false,
      })
      const ruleY = margin + mm(compact ? 12 : 14)
      doc.save()
      doc.strokeColor(POSTCARD.rule).lineWidth(0.6)
      doc
        .moveTo(margin, ruleY)
        .lineTo(page.width - margin, ruleY)
        .stroke()
      doc
        .moveTo(split, ruleY + mm(2))
        .lineTo(split, page.height - margin)
        .stroke()
      doc.restore()
      doc.font(FONT.sans).fontSize(6).fillColor(POSTCARD.rule)
      doc.text('CORRESPONDÊNCIA', margin, ruleY + mm(1.5), { lineBreak: false })
      doc.text('ENDEREÇO', split + mm(3), ruleY + mm(1.5), { lineBreak: false })
    }

    const bodyTop = margin + mm(compact ? 18 : 22)
    const addrX = split + mm(4)
    const addrW = page.width - margin - addrX
    let ay = bodyTop + mm(4)
    if (!running) {
      const stampW = mm(compact ? 16 : 20)
      const stampH = mm(compact ? 20 : 24)
      const stampX = page.width - margin - stampW
      const stampY = bodyTop
      doc.save()
      doc.strokeColor(POSTCARD.stamp).lineWidth(1)
      doc.rect(stampX, stampY, stampW, stampH).stroke()
      doc.font(FONT.sansBold).fontSize(5.5).fillColor(POSTCARD.stamp)
      doc.text((fm.eyebrow || 'SELO').toUpperCase(), stampX + mm(0.8), stampY + mm(2), {
        width: stampW - mm(1.6),
        align: 'center',
      })
      doc.restore()
      ay = stampY + stampH + mm(4)

      doc.font(FONT.letterItalic).fontSize(compact ? 10 : 11).fillColor(POSTCARD.ink)
      if (fm.to) {
        doc.text(fm.to, addrX, ay, { width: addrW })
        ay += mm(14)
      }
      if (fm.from) {
        doc.font(FONT.letter).fontSize(8).fillColor(POSTCARD.rule)
        doc.text(`de ${fm.from}`, addrX, ay, { width: addrW })
        ay += mm(8)
      }
      if (fm.date) {
        doc.font(FONT.letter).fontSize(8)
        doc.text(fm.date, addrX, ay, { width: addrW })
      }
    }

    return {
      x: margin,
      y: bodyTop + mm(4),
      width: split - margin - mm(4),
      maxY: page.height - margin - mm(fm.from ? 10 : 4),
    }
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
      family: 'letter',
      color: POSTCARD.ink,
      align: 'left',
      paragraphSize: compact ? 9 : 10,
      headingSize: compact ? 11 : 12,
      lineHeight: 1.32,
    },
    onNewPage,
  )

  if (fm.from) {
    doc.font(FONT.script).fontSize(compact ? 13 : 15).fillColor(POSTCARD.ink)
    doc.text(fm.from, margin, page.height - margin - mm(8), {
      width: split - margin - mm(4),
      lineBreak: false,
    })
  }

  if (fm.qr) {
    const qx = split + mm(4)
    const qy = page.height - margin - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: POSTCARD.ink, bg: POSTCARD.paper })
  }
}
