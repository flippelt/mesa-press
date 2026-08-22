import type { Block, Inline } from '../types.js'
import { FONT } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'

export function fontFor(family: 'serif' | 'mono', span: Pick<Inline, 'bold' | 'italic' | 'mono'>): string {
  const bold = Boolean(span.bold)
  const italic = Boolean(span.italic)
  if (span.mono || family === 'mono') {
    return bold ? FONT.monoBold : FONT.mono
  }
  if (bold && italic) return FONT.serifBoldItalic
  if (bold) return FONT.serifBold
  if (italic) return FONT.serifItalic
  return FONT.serif
}

function measure(doc: PDFDoc, font: string, size: number, text: string): number {
  doc.font(font).fontSize(size)
  return doc.widthOfString(text)
}

function tokenize(spans: Inline[]): Inline[] {
  const out: Inline[] = []
  for (const span of spans) {
    const parts = span.text.split(/(\s+)/)
    for (const part of parts) {
      if (part) out.push({ ...span, text: part })
    }
  }
  return out
}

type Line = { spans: Inline[]; width: number }

function wrapSpans(
  doc: PDFDoc,
  spans: Inline[],
  maxWidth: number,
  family: 'serif' | 'mono',
  fontSize: number,
): Line[] {
  const tokens = tokenize(spans)
  const lines: Line[] = []
  let current: Inline[] = []
  let width = 0

  const push = (): void => {
    if (!current.length) return
    lines.push({ spans: current, width })
    current = []
    width = 0
  }

  for (const token of tokens) {
    const isSpace = /^\s+$/.test(token.text)
    if (isSpace && current.length === 0) continue
    const font = fontFor(family, token)
    let piece = token.text
    let w = measure(doc, font, fontSize, piece)
    if (w > maxWidth && !isSpace) {
      push()
      const chars = Array.from(piece)
      let offset = 0
      while (offset < chars.length) {
        let lo = 1
        let hi = chars.length - offset
        let fit = 1
        while (lo <= hi) {
          const mid = Math.ceil((lo + hi) / 2)
          const chunk = chars.slice(offset, offset + mid).join('')
          if (measure(doc, font, fontSize, chunk) <= maxWidth) {
            fit = mid
            lo = mid + 1
          } else {
            hi = mid - 1
          }
        }
        const chunk = chars.slice(offset, offset + fit).join('')
        lines.push({
          spans: [{ ...token, text: chunk }],
          width: measure(doc, font, fontSize, chunk),
        })
        offset += fit
      }
      continue
    }
    if (current.length && width + w > maxWidth) {
      push()
      if (isSpace) continue
      w = measure(doc, font, fontSize, piece)
    }
    current.push({ ...token, text: piece })
    width += w
  }
  push()
  return lines
}

export type FlowBox = {
  x: number
  y: number
  width: number
  maxY: number
}

export type FlowStyle = {
  family: 'serif' | 'mono'
  color: string
  align: 'left' | 'center'
  paragraphSize: number
  headingSize: number
  lineHeight: number
}

function drawLine(
  doc: PDFDoc,
  line: Line,
  x: number,
  y: number,
  boxWidth: number,
  family: 'serif' | 'mono',
  fontSize: number,
  color: string,
  align: 'left' | 'center',
): void {
  let cursor = align === 'center' ? x + (boxWidth - line.width) / 2 : x
  for (const span of line.spans) {
    const font = fontFor(family, span)
    doc.font(font).fontSize(fontSize).fillColor(color)
    const w = doc.widthOfString(span.text)
    doc.text(span.text, cursor, y, { lineBreak: false, continued: false })
    cursor += w
  }
}

function ensureRoom(
  box: FlowBox,
  needed: number,
  onNewPage: () => Pick<FlowBox, 'y' | 'maxY'>,
): void {
  if (box.y + needed <= box.maxY) return
  const next = onNewPage()
  box.y = next.y
  box.maxY = next.maxY
}

export function flowBlocks(
  doc: PDFDoc,
  blocks: Block[],
  box: FlowBox,
  style: FlowStyle,
  onNewPage: () => Pick<FlowBox, 'y' | 'maxY'>,
): void {
  const { family, color, align, paragraphSize, headingSize, lineHeight } = style

  const emitLines = (spans: Inline[], size: number, extraGap: number): void => {
    const lines = wrapSpans(doc, spans, box.width, family, size)
    const row = size * lineHeight
    for (const line of lines) {
      ensureRoom(box, row, onNewPage)
      drawLine(doc, line, box.x, box.y, box.width, family, size, color, align)
      box.y += row
    }
    box.y += extraGap
  }

  for (const block of blocks) {
    if (block.type === 'hr') {
      ensureRoom(box, paragraphSize, onNewPage)
      const y = box.y + paragraphSize * 0.35
      const inset = align === 'center' ? box.width * 0.25 : 0
      doc.save()
      doc.strokeColor(color).lineWidth(0.5).opacity(0.55)
      doc
        .moveTo(box.x + inset, y)
        .lineTo(box.x + box.width - inset, y)
        .stroke()
      doc.restore()
      box.y += paragraphSize * 0.8
      continue
    }

    if (block.type === 'heading') {
      box.y += paragraphSize * 0.35
      const size = headingSize - (block.level - 1) * 1.6
      const spans = block.inlines.map((span) => ({ ...span, bold: true }))
      emitLines(spans, size, paragraphSize * 0.25)
      continue
    }

    if (block.type === 'quote') {
      const inner: FlowBox = {
        x: box.x + (align === 'center' ? 0 : 10),
        y: box.y,
        width: box.width - (align === 'center' ? 0 : 10),
        maxY: box.maxY,
      }
      const startY = box.y
      const italicized = block.inlines.map((span) => ({ ...span, italic: true }))
      const lines = wrapSpans(doc, italicized, inner.width, family, paragraphSize)
      const row = paragraphSize * lineHeight
      for (const line of lines) {
        ensureRoom(box, row, onNewPage)
        inner.y = box.y
        drawLine(doc, line, inner.x, box.y, inner.width, family, paragraphSize, color, align)
        box.y += row
      }
      if (align === 'left') {
        doc.save()
        doc.strokeColor(color).lineWidth(1.1).opacity(0.45)
        doc
          .moveTo(box.x + 2, startY)
          .lineTo(box.x + 2, box.y - 2)
          .stroke()
        doc.restore()
      }
      box.y += paragraphSize * 0.35
      continue
    }

    if (block.type === 'list') {
      const size = paragraphSize
      const row = size * lineHeight
      const rendered = block.items.map((item, index) => {
        const marker = block.ordered ? `${index + 1}. ` : '•  '
        const markerFont = fontFor(family, { bold: family === 'mono' })
        const markerW = measure(doc, markerFont, size, marker)
        const lines = wrapSpans(doc, item, box.width - markerW, family, size)
        const lineWidths = lines.map((line) => line.width + markerW)
        return { marker, markerW, lines, width: Math.max(markerW, ...lineWidths) }
      })
      const blockW = Math.max(0, ...rendered.map((item) => item.width))
      const originX = align === 'center' ? box.x + (box.width - blockW) / 2 : box.x

      for (const item of rendered) {
        item.lines.forEach((line, lineIndex) => {
          ensureRoom(box, row, onNewPage)
          if (lineIndex === 0) {
            doc.font(fontFor(family, { bold: family === 'mono' })).fontSize(size).fillColor(color)
            doc.text(item.marker, originX, box.y, { lineBreak: false, continued: false })
          }
          drawLine(
            doc,
            line,
            originX + item.markerW,
            box.y,
            box.width - item.markerW,
            family,
            size,
            color,
            'left',
          )
          box.y += row
        })
        box.y += size * 0.1
      }
      box.y += paragraphSize * 0.2
      continue
    }

    emitLines(block.inlines, paragraphSize, paragraphSize * 0.45)
  }
}

export function drawDiamond(doc: PDFDoc, cx: number, cy: number, r: number, color: string): void {
  doc.save()
  doc.fillColor(color)
  doc.moveTo(cx, cy - r).lineTo(cx + r, cy).lineTo(cx, cy + r).lineTo(cx - r, cy).closePath().fill()
  doc.restore()
}
