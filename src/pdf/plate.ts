import { METAL, type MetalPalette } from '../tokens.js'
import type { PropDocument, ThemeName } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

function metalFor(theme: ThemeName): MetalPalette {
  if (theme === 'brass' || theme === 'gunmetal' || theme === 'iron') return METAL[theme]
  return METAL.iron
}

function rivet(doc: PDFDoc, cx: number, cy: number, pal: MetalPalette): void {
  doc.save()
  doc.fillColor(pal.lo)
  doc.circle(cx, cy, mm(2.1)).fill()
  doc.fillColor(pal.hi)
  doc.circle(cx - 0.4, cy - 0.5, mm(1.15)).fill()
  doc.restore()
}

export function drawPlate(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const pal = metalFor(fm.theme)
  const compact = page.name === 'a6'
  const margin = mm(compact ? 7 : 9)
  const qrSize = mm(QR_MM)
  const footerReserve = mm(fm.qr ? 28 : 12)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(pal.mid)
    doc.save()
    doc.fillColor(pal.hi).fillOpacity(0.42)
    doc.circle(page.width * 0.18, page.height * 0.12, page.width * 0.7).fill()
    doc.fillColor(pal.lo).fillOpacity(0.28)
    doc.circle(page.width * 0.9, page.height * 0.95, page.width * 0.55).fill()
    doc.restore()

    doc.save()
    doc.strokeColor(pal.lo).lineWidth(2.4)
    doc.rect(margin, margin, page.width - 2 * margin, page.height - 2 * margin).stroke()
    doc.lineWidth(0.6)
    doc
      .rect(margin + mm(2.2), margin + mm(2.2), page.width - 2 * margin - mm(4.4), page.height - 2 * margin - mm(4.4))
      .stroke()
    doc.restore()

    const inset = margin + mm(4)
    rivet(doc, inset, inset, pal)
    rivet(doc, page.width - inset, inset, pal)
    rivet(doc, inset, page.height - inset, pal)
    rivet(doc, page.width - inset, page.height - inset, pal)

    const innerX = margin + mm(8)
    const innerW = page.width - innerX * 2
    let y = margin + mm(compact ? 10 : 12)

    if (fm.eyebrow && !running) {
      doc.font(FONT.sansBold).fontSize(compact ? 7 : 8).fillColor(pal.ink).fillOpacity(0.7)
      doc.text(fm.eyebrow.toUpperCase(), innerX, y, { width: innerW, align: 'center' })
      doc.fillOpacity(1)
      y += mm(6)
    }

    doc.font(FONT.sansBold).fontSize(compact ? 13 : 16).fillColor(pal.ink)
    doc.text(fm.title.toUpperCase(), innerX, y, { width: innerW, align: 'center' })
    y += compact ? mm(10) : mm(12)

    if (!running) {
      const meta = [fm.from, fm.to, fm.date].filter(Boolean).join('  ·  ')
      if (meta) {
        doc.font(FONT.sans).fontSize(8).fillColor(pal.ink).fillOpacity(0.75)
        doc.text(meta, innerX, y, { width: innerW, align: 'center' })
        doc.fillOpacity(1)
        y += mm(7)
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
      family: 'sans',
      color: pal.ink,
      align: 'center',
      paragraphSize: compact ? 9 : 10.5,
      headingSize: compact ? 11 : 12.5,
      lineHeight: 1.32,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = (page.width - qrSize) / 2
    const qy = page.height - margin - mm(5) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: pal.lo, bg: pal.hi })
  }
}
