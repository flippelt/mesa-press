import { VELLUM } from '../tokens.js'
import type { PropDocument } from '../types.js'
import type { PDFDoc } from './pdfkit.js'
import { addSameSizePage } from './document.js'
import { drawQr } from './qr.js'
import { drawWaxSeal, waxPalette } from './seal.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { drawDiamond, flowBlocks, type FlowBox } from './text.js'

function stain(doc: PDFDoc, page: PageBox): void {
  doc.save()
  doc.fillColor(VELLUM.stain).fillOpacity(0.13)
  doc.circle(mm(18), mm(24), mm(page.name === 'a6' ? 16 : 22)).fill()
  doc.fillOpacity(0.1)
  doc.circle(page.width - mm(16), page.height - mm(36), mm(page.name === 'a6' ? 18 : 26)).fill()
  doc.restore()
}

function doubleBorder(doc: PDFDoc, page: PageBox, margin: number): void {
  doc.save()
  doc.strokeColor(VELLUM.rule)
  doc.lineWidth(0.7)
  doc.rect(margin, margin, page.width - 2 * margin, page.height - 2 * margin).stroke()
  doc.lineWidth(0.35)
  const inset = mm(1.5)
  doc
    .rect(margin + inset, margin + inset, page.width - 2 * (margin + inset), page.height - 2 * (margin + inset))
    .stroke()
  doc.restore()
}

function drawChrome(doc: PDFDoc, page: PageBox, margin: number): void {
  doc.rect(0, 0, page.width, page.height).fill(VELLUM.bg)
  stain(doc, page)
  doubleBorder(doc, page, margin)
}

function metaRow(
  doc: PDFDoc,
  label: string,
  value: string | undefined,
  x: number,
  y: number,
  width: number,
): number {
  if (!value) return 0
  doc.font('Helvetica').fontSize(7).fillColor(VELLUM.ink).fillOpacity(0.62)
  doc.text(label.toUpperCase(), x, y, {
    width: mm(16),
    lineBreak: false,
    characterSpacing: 1.2,
  })
  doc.fillOpacity(1)
  doc.font('Times-Italic').fontSize(10).fillColor(VELLUM.ink)
  doc.text(value, x + mm(18), y - 1.2, { width: width - mm(18), lineBreak: false })
  return mm(6.2)
}

export function drawLetter(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 8 : 10)
  const innerX = margin + mm(7)
  const innerW = page.width - innerX * 2
  const qrSize = mm(QR_MM)
  const sealR = mm(compact ? 8 : 9.5)
  const palette = waxPalette(fm.seal)
  const footerReserve = mm(fm.qr || palette ? 28 : 16)

  const paint = (running: boolean): FlowBox => {
    drawChrome(doc, page, margin)
    let y = margin + mm(compact ? 7 : 9)

    doc.font('Times-Bold').fontSize(compact ? 11 : 14).fillColor(VELLUM.ink)
    const title = running ? fm.title : fm.title.toUpperCase()
    doc.text(title, innerX, y, {
      width: innerW,
      align: 'center',
      characterSpacing: running ? 0.4 : 2.1,
    })
    y += compact ? mm(8) : mm(10)

    const ruleY = y
    doc.save()
    doc.strokeColor(VELLUM.rule).lineWidth(0.6)
    doc
      .moveTo(innerX, ruleY)
      .lineTo(innerX + innerW / 2 - mm(4), ruleY)
      .stroke()
    doc
      .moveTo(innerX + innerW / 2 + mm(4), ruleY)
      .lineTo(innerX + innerW, ruleY)
      .stroke()
    doc.restore()
    drawDiamond(doc, innerX + innerW / 2, ruleY, 2.2, VELLUM.ink)
    y += mm(6)

    if (!running) {
      y += metaRow(doc, 'De', fm.from, innerX, y, innerW)
      y += metaRow(doc, 'Para', fm.to, innerX, y, innerW)
      y += metaRow(doc, 'Data', fm.date, innerX, y, innerW)
      if (fm.from || fm.to || fm.date) {
        doc.save()
        doc.strokeColor(VELLUM.rule).lineWidth(0.4)
        doc
          .moveTo(innerX, y)
          .lineTo(innerX + innerW, y)
          .stroke()
        doc.restore()
        y += mm(5)
      }
    }

    const maxY = page.height - margin - footerReserve
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
      family: 'serif',
      color: VELLUM.ink,
      align: 'left',
      paragraphSize: compact ? 9.5 : 11,
      headingSize: compact ? 12 : 13.5,
      lineHeight: 1.38,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = margin + mm(6)
    const qy = page.height - margin - mm(6) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: VELLUM.ink, bg: VELLUM.bg })
    doc.save()
    doc.strokeColor(VELLUM.rule).lineWidth(0.4)
    doc.rect(qx - 1.2, qy - 1.2, qrSize + 2.4, qrSize + 2.4).stroke()
    doc.restore()
  }

  if (palette) {
    const cx = page.width - margin - mm(6) - sealR
    const cy = page.height - margin - mm(6) - sealR
    drawWaxSeal(doc, cx, cy, sealR, palette)
  }
}
