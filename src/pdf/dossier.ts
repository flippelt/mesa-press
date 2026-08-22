import { DOSSIER } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

export function drawDossier(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const qrSize = mm(QR_MM)
  const footerReserve = mm(fm.qr ? 26 : 12)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(DOSSIER.folder)

    const tabW = mm(compact ? 42 : 52)
    const tabH = mm(compact ? 9 : 11)
    doc.save()
    doc.fillColor(DOSSIER.tab)
    doc.rect(mm(10), 0, tabW, tabH).fill()
    doc.restore()
    doc.font(FONT.sansBold).fontSize(compact ? 7 : 8).fillColor(DOSSIER.page)
    doc.text('DOSSIÊ', mm(10), mm(compact ? 2.4 : 3), { width: tabW, align: 'center' })

    const pageX = mm(compact ? 6 : 8)
    const pageY = tabH + mm(2)
    const pageW = page.width - 2 * pageX
    const pageH = page.height - pageY - mm(compact ? 6 : 8)
    doc.save()
    doc.fillColor(DOSSIER.page)
    doc.rect(pageX, pageY, pageW, pageH).fill()
    doc.strokeColor(DOSSIER.rule).lineWidth(0.6)
    doc.rect(pageX, pageY, pageW, pageH).stroke()
    doc.restore()

    const innerX = pageX + mm(7)
    const innerW = pageW - mm(14)
    let y = pageY + mm(compact ? 6 : 8)

    if (fm.eyebrow && !running) {
      doc.save()
      doc.rotate(-12, { origin: [innerX + innerW - mm(18), y + mm(8)] })
      doc.font(FONT.sansBold).fontSize(compact ? 9 : 11).fillColor('#7a1f16').fillOpacity(0.72)
      doc.text(fm.eyebrow.toUpperCase(), innerX + innerW - mm(38), y, {
        width: mm(40),
        align: 'center',
      })
      doc.restore()
    }

    doc.font(FONT.serifBold).fontSize(compact ? 13 : 16).fillColor(DOSSIER.ink)
    doc.text(fm.title, innerX, y, { width: innerW * 0.72 })
    y += compact ? mm(10) : mm(12)

    if (!running) {
      const line = (label: string, value: string | undefined): void => {
        if (!value) return
        doc.font(FONT.sansBold).fontSize(7).fillColor(DOSSIER.ink).fillOpacity(0.55)
        doc.text(label, innerX, y, { width: mm(20), lineBreak: false })
        doc.fillOpacity(1)
        doc.font(FONT.serif).fontSize(10).fillColor(DOSSIER.ink)
        doc.text(value, innerX + mm(20), y - 1, { width: innerW - mm(20), lineBreak: false })
        y += mm(6)
      }
      line('ORIGEM', fm.from)
      line('DESTINO', fm.to)
      line('DATA', fm.date)
      if (fm.from || fm.to || fm.date) {
        doc.save()
        doc.strokeColor(DOSSIER.rule).lineWidth(0.5)
        doc
          .moveTo(innerX, y)
          .lineTo(innerX + innerW, y)
          .stroke()
        doc.restore()
        y += mm(5)
      }
    }

    return {
      x: innerX,
      y,
      width: innerW,
      maxY: pageY + pageH - footerReserve,
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
      family: 'serif',
      color: DOSSIER.ink,
      align: 'left',
      paragraphSize: compact ? 9 : 10.5,
      headingSize: compact ? 11 : 12.5,
      lineHeight: 1.36,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = page.width - mm(compact ? 14 : 16) - qrSize
    const qy = page.height - mm(compact ? 14 : 16) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: DOSSIER.ink, bg: DOSSIER.page })
  }
}
