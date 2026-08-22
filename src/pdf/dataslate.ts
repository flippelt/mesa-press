import { DATASLATE, type DataslatePalette } from '../tokens.js'
import type { PropDocument, ThemeName } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

function paletteFor(theme: ThemeName): DataslatePalette {
  return theme === 'amber' ? DATASLATE.amber : DATASLATE.imperial
}

function screw(doc: PDFDoc, cx: number, cy: number, pal: DataslatePalette): void {
  doc.save()
  doc.fillColor(pal.bezel)
  doc.circle(cx, cy, mm(2.1)).fill()
  doc.fillColor(pal.bg)
  doc.circle(cx, cy, mm(1.25)).fill()
  doc.strokeColor(pal.fg).strokeOpacity(0.35).lineWidth(0.5)
  doc
    .moveTo(cx - mm(0.8), cy)
    .lineTo(cx + mm(0.8), cy)
    .stroke()
  doc
    .moveTo(cx, cy - mm(0.8))
    .lineTo(cx, cy + mm(0.8))
    .stroke()
  doc.restore()
}

function scanlines(
  doc: PDFDoc,
  x: number,
  y: number,
  w: number,
  h: number,
  pal: DataslatePalette,
): void {
  doc.save()
  doc.strokeColor(pal.fg).strokeOpacity(0.05).lineWidth(0.4)
  for (let yy = y; yy < y + h; yy += 2.4) {
    doc.moveTo(x, yy).lineTo(x + w, yy).stroke()
  }
  doc.restore()
}

export function drawDataslate(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const pal = paletteFor(fm.theme)
  const compact = page.name === 'a6'
  const bezel = mm(compact ? 7 : 9)
  const qrSize = mm(QR_MM)
  const footerReserve = mm(fm.qr ? 28 : 14)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(pal.bezel)

    const screenX = bezel
    const screenY = bezel
    const screenW = page.width - 2 * bezel
    const screenH = page.height - 2 * bezel
    doc.save()
    doc.fillColor(pal.bg)
    doc.roundedRect(screenX, screenY, screenW, screenH, mm(2.2)).fill()
    doc.restore()

    doc.save()
    doc.strokeColor(pal.muted).lineWidth(1.1)
    doc.roundedRect(screenX + mm(1.4), screenY + mm(1.4), screenW - mm(2.8), screenH - mm(2.8), mm(1.6)).stroke()
    doc.restore()

    screw(doc, bezel / 2, bezel / 2, pal)
    screw(doc, page.width - bezel / 2, bezel / 2, pal)
    screw(doc, bezel / 2, page.height - bezel / 2, pal)
    screw(doc, page.width - bezel / 2, page.height - bezel / 2, pal)

    const barH = mm(compact ? 7 : 8)
    const barX = screenX + mm(3)
    const barY = screenY + mm(3)
    const barW = screenW - mm(6)
    doc.save()
    doc.fillColor(pal.muted)
    doc.rect(barX, barY, barW, barH).fill()
    doc.restore()

    doc.font(FONT.monoBold).fontSize(compact ? 7 : 8).fillColor(pal.fg)
    doc.text(':: DATASLATE ::', barX + mm(2), barY + mm(2.2), {
      width: barW * 0.62,
      lineBreak: false,
      characterSpacing: 0.6,
    })
    const tag = fm.theme === 'amber' ? 'AMBER' : 'IMPERIAL'
    doc.font(FONT.mono).fontSize(compact ? 6.5 : 7.5)
    doc.text(tag, barX, barY + mm(2.4), {
      width: barW - mm(2),
      align: 'right',
      lineBreak: false,
    })

    scanlines(doc, screenX + mm(2), barY + barH + mm(1), screenW - mm(4), screenH - barH - mm(8), pal)

    let y = barY + barH + mm(compact ? 4 : 5)
    const innerX = screenX + mm(5)
    const innerW = screenW - mm(10)

    if (fm.eyebrow && !running) {
      const eyebrow = fm.eyebrow.toUpperCase()
      doc.font(FONT.mono).fontSize(compact ? 7 : 8).fillColor(pal.fg).fillOpacity(0.7)
      doc.text(eyebrow, innerX, y, {
        width: innerW,
        characterSpacing: isAscii(eyebrow) ? 1.1 : 0,
      })
      doc.fillOpacity(1)
      y += mm(5)
    }

    doc.font(FONT.monoBold).fontSize(compact ? 11 : 13).fillColor(pal.fg)
    const titleH = doc.heightOfString(fm.title.toUpperCase(), { width: innerW })
    doc.text(fm.title.toUpperCase(), innerX, y, { width: innerW })
    y += titleH + mm(2)

    const meta = [fm.from, fm.to, fm.date].filter(Boolean).join('  ·  ')
    if (meta && !running) {
      doc.font(FONT.mono).fontSize(compact ? 7 : 8).fillColor(pal.fg).fillOpacity(0.65)
      doc.text(meta, innerX, y, { width: innerW })
      doc.fillOpacity(1)
      y += mm(5)
    }

    doc.save()
    doc.strokeColor(pal.fg).strokeOpacity(0.35).lineWidth(0.6)
    doc
      .moveTo(innerX, y)
      .lineTo(innerX + innerW, y)
      .stroke()
    doc.restore()
    y += mm(4)

    const ledX = page.width - bezel - mm(5)
    const ledY = page.height - bezel - mm(4)
    doc.save()
    doc.fillColor(pal.fg).fillOpacity(0.9)
    doc.circle(ledX, ledY, mm(1.1)).fill()
    doc.fillOpacity(0.25)
    doc.circle(ledX, ledY, mm(2.1)).fill()
    doc.restore()

    return {
      x: innerX,
      y,
      width: innerW,
      maxY: page.height - bezel - footerReserve,
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
      family: 'mono',
      color: pal.fg,
      align: 'left',
      paragraphSize: compact ? 8 : 9.2,
      headingSize: compact ? 10 : 11,
      lineHeight: 1.32,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = (page.width - qrSize) / 2
    const qy = page.height - bezel - mm(5) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: pal.fg, bg: pal.bg })
  }
}
