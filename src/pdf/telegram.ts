import { TELEGRAM } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

function formRule(doc: PDFDoc, x0: number, x1: number, y: number, width = 0.6): void {
  doc.save()
  doc.strokeColor(TELEGRAM.rule).lineWidth(width)
  doc
    .moveTo(x0, y)
    .lineTo(x1, y)
    .stroke()
  doc.restore()
}

function stamp(doc: PDFDoc, text: string, cx: number, cy: number): void {
  doc.save()
  doc.rotate(-12, { origin: [cx, cy] })
  doc.strokeColor(TELEGRAM.urgent).opacity(0.72).lineWidth(1.4)
  doc.roundedRect(cx - mm(18), cy - mm(7), mm(36), mm(14), 3).stroke()
  doc.font(FONT.sansBold).fontSize(11).fillColor(TELEGRAM.urgent).fillOpacity(0.78)
  doc.text(text.toUpperCase(), cx - mm(17), cy - mm(3.6), {
    width: mm(34),
    align: 'center',
    lineBreak: false,
    characterSpacing: isAscii(text) ? 1.1 : 0,
  })
  doc.restore()
}

export function drawTelegram(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 7 : 9)
  const qrSize = mm(compact ? 16 : QR_MM)
  const formX = margin
  const formY = margin
  const formW = page.width - 2 * margin
  const formH = page.height - 2 * margin
  const headH = mm(compact ? 24 : 30)
  const sideW = mm(compact ? 24 : 30)
  const innerX = formX + mm(4)
  const innerW = formW - mm(8)
  const footerReserve = mm(fm.qr ? 8 : 6) + (fm.qr ? qrSize : 0)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill('#efe6d0')
    doc.rect(formX, formY, formW, formH).fill(TELEGRAM.paper)
    doc.save()
    doc.strokeColor(TELEGRAM.ink).lineWidth(1.7)
    doc.rect(formX, formY, formW, formH).stroke()
    doc.lineWidth(0.4)
    doc.rect(formX + 2.4, formY + 2.4, formW - 4.8, formH - 4.8).stroke()
    doc.restore()

    const headY = formY
    doc.save()
    doc.strokeColor(TELEGRAM.ink).lineWidth(0.8)
    doc.rect(formX, headY, sideW, headH).stroke()
    doc.rect(formX + formW - sideW, headY, sideW, headH).stroke()
    formRule(doc, formX, formX + formW, headY + headH, 1.1)
    doc.restore()

    const klass = (fm.eyebrow || 'telegrama').toUpperCase()
    doc.font(FONT.sansBold).fontSize(5).fillColor(TELEGRAM.muted)
    doc.text('SERVIÇO', formX + mm(1.6), headY + mm(2.2), {
      width: sideW - mm(3),
      align: 'center',
      lineBreak: false,
    })
    doc.font(FONT.sansBold).fontSize(compact ? 7 : 8).fillColor(TELEGRAM.ink)
    doc.text(klass, formX + mm(1.4), headY + mm(8), {
      width: sideW - mm(2.8),
      align: 'center',
    })

    doc.font(FONT.serifBold).fontSize(compact ? 16 : 22).fillColor(TELEGRAM.ink)
    doc.text('TELEGRAMA', formX + sideW, headY + mm(compact ? 6 : 7), {
      width: formW - 2 * sideW,
      align: 'center',
      lineBreak: false,
      characterSpacing: 1.4,
    })
    doc.font(FONT.sans).fontSize(5).fillColor(TELEGRAM.muted)
    doc.text('Transmite e entrega mensagens sob as condições impressas no verso.', formX + sideW, headY + mm(compact ? 16 : 20), {
      width: formW - 2 * sideW,
      align: 'center',
    })

    doc.font(FONT.sansBold).fontSize(5).fillColor(TELEGRAM.muted)
    doc.text('Nº / HORA', formX + formW - sideW + mm(1.6), headY + mm(2.2), {
      width: sideW - mm(3),
      align: 'center',
      lineBreak: false,
    })
    if (fm.date) {
      doc.font(FONT.mono).fontSize(6.5).fillColor(TELEGRAM.ink)
      doc.text(fm.date, formX + formW - sideW + mm(1.4), headY + mm(9), {
        width: sideW - mm(2.8),
        align: 'center',
      })
    }

    let y = formY + headH + mm(compact ? 4 : 5)
    if (!running) {
      const row = (label: string, value: string | undefined): void => {
        if (!value) return
        doc.font(FONT.sansBold).fontSize(6.5).fillColor(TELEGRAM.muted)
        doc.text(label, innerX, y, { width: mm(14), lineBreak: false })
        doc.font(FONT.mono).fontSize(compact ? 8.5 : 9.5).fillColor(TELEGRAM.ink)
        doc.text(value.toUpperCase(), innerX + mm(16), y - 0.8, {
          width: innerW - mm(16),
          lineBreak: false,
        })
        y += mm(6)
        formRule(doc, innerX, innerX + innerW, y - mm(1.2), 0.45)
      }
      row('DE', fm.from)
      row('PARA', fm.to)
      if (!fm.from && !fm.to && fm.date) row('EM', fm.date)
      y += mm(2)
    }

    if (!running && fm.eyebrow) {
      stamp(doc, fm.eyebrow, formX + formW - mm(compact ? 22 : 28), formY + headH + mm(10))
    }

    doc.font(FONT.sansBold).fontSize(compact ? 9 : 10).fillColor(TELEGRAM.ink)
    doc.text(fm.title.toUpperCase(), innerX, y, { width: innerW, lineBreak: false })
    y += mm(compact ? 6 : 7)
    formRule(doc, innerX, innerX + innerW, y - mm(1), 0.7)
    y += mm(2)

    const maxY = formY + formH - mm(5) - footerReserve
    doc.save()
    doc.strokeColor(TELEGRAM.rule).opacity(0.18).lineWidth(0.35)
    for (let lineY = y + mm(3); lineY < maxY; lineY += mm(5.2)) {
      doc
        .moveTo(innerX, lineY)
        .lineTo(innerX + innerW, lineY)
        .stroke()
    }
    doc.restore()

    return { x: innerX, y, width: innerW, maxY }
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
      lineHeight: 1.45,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = formX + formW - mm(5) - qrSize
    const qy = formY + formH - mm(5) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: TELEGRAM.ink, bg: TELEGRAM.paper })
  }
}
