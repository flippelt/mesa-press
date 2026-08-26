import { NEWSPAPER } from '../tokens.js'
import type { Block, Inline, PropDocument, ThemeName } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { drawLine, flowBlocks, fontFor, wrapSpans, type FlowBox } from './text.js'

/** Notícias de preenchimento — genéricas, sem campanha. Determinísticas via semente. */
export const NEWSPAPER_FILLERS = [
  {
    kicker: 'interior',
    title: 'Geada queima hortas da várzea',
    body: 'Lavradores relatam perda de folhas tenras. O nabo chega mais caro à feira de sábado. Ninguém fala em seguro.',
  },
  {
    kicker: 'porto',
    title: 'Barcaça atrasa duas marés',
    body: 'Neblina no canal. Passageiros esperam no cais sem café e sem previsão. O mestre jura que o relógio da torre é que está errado.',
  },
  {
    kicker: 'cidade',
    title: 'Sumiu o gato do padeiro',
    body: 'Responde por Pardo. Recompensa: uma tigela de leite e meio pão de ontem. Procurar o forno às seis.',
  },
  {
    kicker: 'anúncios',
    title: 'Vende-se piano quase afinado',
    body: 'Faltam duas teclas. Não sobe escada. Tratar no terceiro andar, depois do almoço, se houver dono.',
  },
  {
    kicker: 'esporte',
    title: 'Empate sem gols no campo',
    body: 'A bola furou aos vinte. A torcida foi embora no intervalo. O juiz perdeu o apito.',
  },
  {
    kicker: 'tempo',
    title: 'Chove à tarde, seca à noite',
    body: 'O relógio da praça segue parado nas três e dez. Pombos ocupam o ponteiro das horas.',
  },
  {
    kicker: 'sociedade',
    title: 'Clube de damas adia o chá',
    body: 'Faltou açúcar. A reunião passa para quinta, se o forno acender. Trazer xícara própria.',
  },
  {
    kicker: 'nota',
    title: 'Cão late para o correio',
    body: 'O carteiro recusa a rua das acácias. Cartas acumulam na estação. O cão não sabe ler.',
  },
  {
    kicker: 'mercado',
    title: 'Preço do sal sobe um níquel',
    body: 'Dizem que o carregamento molhou. As donas de casa fazem fila mesmo assim. Ninguém volta vazio.',
  },
  {
    kicker: 'campo',
    title: 'Moinho para por falta de vento',
    body: 'Moleiro espera a brisa desde segunda. Farinha racionada na mercearia da esquina.',
  },
] as const

type Filler = (typeof NEWSPAPER_FILLERS)[number]

function hashString(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function shuffle<T>(items: readonly T[], rnd: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1))
    const a = out[i]
    const b = out[j]
    if (a === undefined || b === undefined) continue
    out[i] = b
    out[j] = a
  }
  return out
}

function rules(doc: PDFDoc, x: number, y: number, w: number): void {
  doc.save()
  doc.strokeColor(NEWSPAPER.rule).lineWidth(1.4)
  doc
    .moveTo(x, y)
    .lineTo(x + w, y)
    .stroke()
  doc.lineWidth(0.35)
  doc
    .moveTo(x, y + 2.4)
    .lineTo(x + w, y + 2.4)
    .stroke()
  doc.restore()
}

function columnRule(doc: PDFDoc, x: number, y0: number, y1: number): void {
  doc.save()
  doc.strokeColor(NEWSPAPER.rule).opacity(0.5)
  doc.lineWidth(0.45)
  doc
    .moveTo(x, y0)
    .lineTo(x, y1)
    .stroke()
  doc.restore()
}

function tornPaperPath(
  doc: PDFDoc,
  x: number,
  y: number,
  w: number,
  h: number,
  rnd: () => number,
): void {
  const jog = (amp: number): number => (rnd() - 0.5) * mm(amp)
  const steps = 9
  doc.moveTo(x + jog(1.8), y + jog(1.8))
  for (let i = 1; i <= steps; i++) doc.lineTo(x + (w * i) / steps + jog(2.2), y + jog(1.6))
  for (let i = 1; i <= steps; i++) doc.lineTo(x + w + jog(1.8), y + (h * i) / steps + jog(2.2))
  for (let i = 1; i <= steps; i++) doc.lineTo(x + w - (w * i) / steps + jog(2.2), y + h + jog(1.8))
  for (let i = 1; i <= steps; i++) doc.lineTo(x + jog(1.8), y + h - (h * i) / steps + jog(2.2))
  doc.closePath()
}

function newsprintTexture(
  doc: PDFDoc,
  x: number,
  y: number,
  w: number,
  h: number,
  rnd: () => number,
): void {
  doc.save()
  doc.rect(x, y, w, h).clip()
  doc.fillColor('#5c5c58').opacity(0.09)
  for (let i = 0; i < 220; i++) {
    doc.circle(x + rnd() * w, y + rnd() * h, 0.2 + rnd() * 0.5).fill()
  }
  doc.restore()
}

function wrapPlain(doc: PDFDoc, text: string, width: number, font: string, size: number): string[] {
  doc.font(font).fontSize(size)
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (current && doc.widthOfString(next) > width) {
      lines.push(current)
      current = word
    } else {
      current = next
    }
  }
  if (current) lines.push(current)
  return lines
}

function drawFillerColumn(
  doc: PDFDoc,
  articles: readonly Filler[],
  x: number,
  y0: number,
  w: number,
  maxY: number,
  seed: number,
): void {
  const rnd = mulberry32(seed)
  const pile = shuffle(articles, rnd)
  let cy = y0 - mm(2 + rnd() * 8)
  doc.save()
  doc.rect(x - 0.4, y0, w + 0.8, Math.max(0, maxY - y0)).clip()

  const emit = (font: string, size: number, color: string, opacity: number, lines: string[], gap: number): void => {
    const row = size * 1.22
    doc.font(font).fontSize(size).fillColor(color).fillOpacity(opacity)
    for (const line of lines) {
      if (cy > maxY) break
      doc.text(line, x, cy, { lineBreak: false, continued: false })
      cy += row
    }
    doc.fillOpacity(1)
    cy += gap
  }

  for (let i = 0; i < 24 && cy < maxY; i++) {
    const article = pile[i % pile.length]
    if (!article) break

    emit(FONT.sansBold, 5, NEWSPAPER.kicker, 1, [article.kicker.toUpperCase()], mm(0.6))
    emit(
      FONT.serifBold,
      7,
      NEWSPAPER.filler,
      1,
      wrapPlain(doc, article.title, w, FONT.serifBold, 7),
      mm(0.8),
    )

    if (cy < maxY) {
      doc.save()
      doc.strokeColor(NEWSPAPER.rule).opacity(0.4).lineWidth(0.3)
      doc
        .moveTo(x, cy)
        .lineTo(x + w, cy)
        .stroke()
      doc.restore()
      cy += mm(1.4)
    }

    emit(
      FONT.serif,
      5.6,
      NEWSPAPER.filler,
      0.78,
      wrapPlain(doc, article.body, w, FONT.serif, 5.6),
      mm(3.8),
    )
  }

  doc.restore()
}

function stainClippings(doc: PDFDoc, x: number, y: number, w: number, h: number): void {
  doc.save()
  doc.fillColor(NEWSPAPER.stain).fillOpacity(0.06)
  doc.circle(x + mm(12), y + mm(16), mm(11)).fill()
  doc.fillOpacity(0.05)
  doc.circle(x + w - mm(10), y + h - mm(20), mm(13)).fill()
  doc.strokeColor(NEWSPAPER.stain).fillOpacity(1).opacity(0.11).lineWidth(1)
  doc.circle(x + w * 0.8, y + h * 0.3, mm(8)).stroke()
  doc.lineWidth(0.45)
  doc.circle(x + w * 0.8, y + h * 0.3, mm(6.6)).stroke()
  doc.restore()
}

function splitHeadline(blocks: Block[]): { headline?: Inline[]; body: Block[] } {
  const index = blocks.findIndex((block) => block.type === 'heading')
  if (index < 0) return { body: blocks }
  const heading = blocks[index]
  if (!heading || heading.type !== 'heading') return { body: blocks }
  return {
    headline: heading.inlines,
    body: [...blocks.slice(0, index), ...blocks.slice(index + 1)],
  }
}

function drawClassifieds(
  doc: PDFDoc,
  x: number,
  y: number,
  w: number,
  h: number,
  seed: number,
): void {
  const pile = shuffle(NEWSPAPER_FILLERS, mulberry32(seed))
  const ads = pile.slice(0, 2)
  doc.save()
  doc.rect(x, y, w, h).clip()
  doc.strokeColor(NEWSPAPER.rule).opacity(0.65).lineWidth(0.7)
  doc.rect(x, y, w, h).stroke()
  doc.font(FONT.sansBold).fontSize(5.5).fillColor(NEWSPAPER.kicker)
  doc.text('ANÚNCIOS', x + mm(2), y + mm(1.4), { lineBreak: false })
  let cy = y + mm(5.4)
  doc.font(FONT.serif).fontSize(6.2).fillColor(NEWSPAPER.ink)
  for (const ad of ads) {
    if (!ad || cy > y + h - mm(2.5)) break
    const line = `${ad.title} — ${ad.body}`
    const wrapped = wrapPlain(doc, line, w - mm(4), FONT.serif, 6.2)
    for (const piece of wrapped.slice(0, 2)) {
      doc.text(piece, x + mm(2), cy, { lineBreak: false, continued: false })
      cy += mm(3)
    }
    cy += mm(0.8)
  }
  doc.restore()
}

type ClipCols = { col1: FlowBox; col2: FlowBox }

type ColumnRow = {
  height: number
  gap: number
  render: (x: number, y: number, width: number) => void
}

function columnRows(doc: PDFDoc, blocks: Block[], width: number): ColumnRow[] {
  const size = 9
  const headingSize = 10.5
  const lineHeight = 1.18
  const family = 'serif' as const
  const color = NEWSPAPER.ink
  const rows: ColumnRow[] = []

  const pushLines = (spans: Inline[], fontSize: number, extraGap: number, justify: boolean): void => {
    const lines = wrapSpans(doc, spans, width, family, fontSize)
    const rowH = fontSize * lineHeight
    lines.forEach((line, index) => {
      const last = index === lines.length - 1
      rows.push({
        height: rowH,
        gap: last ? extraGap : 0,
        render: (x, y, w) => {
          drawLine(
            doc,
            line,
            x,
            y,
            w,
            family,
            fontSize,
            color,
            justify && !last ? 'justify' : 'left',
          )
        },
      })
    })
  }

  for (const block of blocks) {
    if (block.type === 'hr') {
      rows.push({
        height: size * 0.7,
        gap: 0,
        render: (x, y, w) => {
          doc.save()
          doc.strokeColor(color).lineWidth(0.4).opacity(0.5)
          doc
            .moveTo(x, y + size * 0.25)
            .lineTo(x + w, y + size * 0.25)
            .stroke()
          doc.restore()
        },
      })
      continue
    }
    if (block.type === 'heading') {
      pushLines(
        block.inlines.map((span) => ({ ...span, bold: true })),
        headingSize - (block.level - 1),
        size * 0.2,
        false,
      )
      continue
    }
    if (block.type === 'quote') {
      pushLines(
        block.inlines.map((span) => ({ ...span, italic: true })),
        size,
        size * 0.25,
        true,
      )
      continue
    }
    if (block.type === 'list') {
      for (const [index, item] of block.items.entries()) {
        const marker = block.ordered ? `${index + 1}. ` : '• '
        const markerFont = fontFor(family, { bold: false })
        doc.font(markerFont).fontSize(size)
        const markerW = doc.widthOfString(marker)
        const lines = wrapSpans(doc, item, Math.max(20, width - markerW), family, size)
        const rowH = size * lineHeight
        lines.forEach((line, lineIndex) => {
          rows.push({
            height: rowH,
            gap: 0,
            render: (x, y, w) => {
              if (lineIndex === 0) {
                doc.font(markerFont).fontSize(size).fillColor(color)
                doc.text(marker, x, y, { lineBreak: false, continued: false })
              }
              drawLine(doc, line, x + markerW, y, w - markerW, family, size, color, 'left')
            },
          })
        })
      }
      if (rows.length) rows[rows.length - 1]!.gap = size * 0.2
      continue
    }
    pushLines(block.inlines, size, size * 0.35, true)
  }
  return rows
}

function placeColumns(
  start: ClipCols,
  onNewPage: () => ClipCols,
  rows: ColumnRow[],
  columns: 1 | 2,
): void {
  const total = rows.reduce((sum, row) => sum + row.height + row.gap, 0)
  const colH = Math.max(1, start.col1.maxY - start.col1.y)
  const splitAt = columns === 1 ? Number.POSITIVE_INFINITY : total <= colH * 1.05 ? total / 2 : colH

  let boxes = start
  let col = 0
  let used = 0
  const current = (): FlowBox => (col === 0 ? boxes.col1 : boxes.col2)

  for (const row of rows) {
    const needed = row.height
    if (col === 0 && used > 0 && used + needed > splitAt) {
      col = 1
      used = 0
    }
    if (current().y + needed > current().maxY) {
      if (col === 0) {
        col = 1
        used = 0
      }
      if (current().y + needed > current().maxY) {
        boxes = onNewPage()
        col = 0
        used = 0
      }
    }
    const box = current()
    row.render(box.x, box.y, box.width)
    box.y += row.height + row.gap
    used += row.height + row.gap
  }
}

type ClipKind = 'clipping' | 'column' | 'headline'
type ClipLayout = ClipCols & { columns: 1 | 2; qr?: { x: number; y: number; size: number } }

function clipKind(theme: ThemeName): ClipKind | 'plain' {
  if (theme === 'column' || theme === 'headline' || theme === 'clipping') return theme
  return 'plain'
}

function measureHeader(
  doc: PDFDoc,
  fm: PropDocument['frontmatter'],
  headline: Inline[] | undefined,
  storyW: number,
  compact: boolean,
  kind: ClipKind,
): number {
  let h = 0
  if (kind === 'clipping') h += compact ? mm(9) : mm(12)
  h += mm(8)
  if (fm.eyebrow) h += mm(4)
  if (headline) {
    const hSize = kind === 'headline' ? (compact ? 16 : 22) : compact ? 12 : 15
    const lines = wrapSpans(
      doc,
      headline.map((span) => ({ ...span, bold: true })),
      storyW,
      'serif',
      hSize,
    )
    h += lines.length * hSize * 1.08 + mm(5)
  }
  return h
}

function paintClippingChrome(
  doc: PDFDoc,
  prop: PropDocument,
  page: PageBox,
  running: boolean,
  headline: Inline[] | undefined,
  body: Block[],
  kind: ClipKind,
): ClipLayout {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const seed = hashString(`${fm.title}\0${fm.date ?? ''}\0${fm.from ?? ''}`)
  const rndPaper = mulberry32(seed)
  const pad = mm(compact ? 6 : 8)
  const widthRatio = kind === 'column' ? 0.64 : kind === 'headline' ? 0.92 : 1
  const paperW = (page.width - 2 * pad) * widthRatio
  const inset = mm(compact ? 4 : 5.5)
  const withSliver = kind === 'clipping'
  const withAds = kind === 'clipping'
  const sliverW = withSliver ? (compact ? mm(11) : mm(15)) : 0
  const gap = withSliver ? mm(compact ? 2.4 : 3.2) : 0
  const storyW = paperW - 2 * inset - sliverW - gap
  const colGap = mm(compact ? 2.8 : 3.4)
  const colW = Math.max(mm(20), (storyW - colGap) / 2)
  const qrSize = mm(compact ? 14 : 18)
  const adH = withAds ? mm(compact ? 16 : 18) : 0
  const qrGap = fm.qr ? qrSize + mm(4) : 0
  const headerH = measureHeader(doc, fm, running ? undefined : headline, storyW, compact, kind)
  const twoColRows = columnRows(doc, body, colW)
  const oneColRows = columnRows(doc, body, storyW)
  const twoTotal = twoColRows.reduce((sum, row) => sum + row.height + row.gap, 0)
  const oneTotal = oneColRows.reduce((sum, row) => sum + row.height + row.gap, 0)
  const columns: 1 | 2 =
    kind === 'column' || kind === 'headline' ? 1 : twoTotal > mm(32) ? 2 : 1
  const bodyH = Math.max(mm(12), columns === 2 ? Math.ceil(twoTotal / 2) + mm(2) : oneTotal + mm(1))
  const maxH = page.height - 2 * pad
  const minH = mm(kind === 'headline' ? (compact ? 42 : 52) : compact ? 58 : 70)
  let paperH = inset * 2 + headerH + bodyH + mm(2) + adH + qrGap
  if (running || paperH > maxH) paperH = maxH
  else paperH = Math.min(maxH, Math.max(minH, paperH))
  const paper = {
    x: (page.width - paperW) / 2,
    y: (page.height - paperH) / 2,
    w: paperW,
    h: paperH,
  }

  doc.rect(0, 0, page.width, page.height).fill(NEWSPAPER.page)

  doc.save()
  doc.translate(1.6, 2.2)
  tornPaperPath(doc, paper.x, paper.y, paper.w, paper.h, mulberry32(seed))
  doc.fillColor('#1c1c1a').fillOpacity(0.18).fill()
  doc.restore()

  tornPaperPath(doc, paper.x, paper.y, paper.w, paper.h, mulberry32(seed))
  doc.fillColor(NEWSPAPER.aged).fill()
  tornPaperPath(doc, paper.x, paper.y, paper.w, paper.h, mulberry32(seed))
  doc.strokeColor(NEWSPAPER.ink).opacity(0.28).lineWidth(0.5).stroke()

  doc.save()
  tornPaperPath(doc, paper.x, paper.y, paper.w, paper.h, mulberry32(seed))
  doc.clip()
  newsprintTexture(doc, paper.x, paper.y, paper.w, paper.h, rndPaper)
  stainClippings(doc, paper.x, paper.y, paper.w, paper.h)

  const innerX = paper.x + inset
  const innerY = paper.y + inset
  const innerBottom = paper.y + paper.h - inset
  const storyX = innerX + sliverW + gap

  if (withSliver) {
    drawFillerColumn(
      doc,
      NEWSPAPER_FILLERS,
      paper.x + mm(1.6),
      paper.y + mm(1),
      sliverW + mm(1),
      innerBottom,
      hashString(`${fm.title}|sliver|${running ? 1 : 0}`),
    )
    columnRule(doc, storyX - gap * 0.5, innerY, innerBottom - adH - qrGap - mm(2))
  }

  let y = innerY
  if (kind === 'clipping') {
    doc.font(FONT.serifBold).fontSize(compact ? 13 : 17).fillColor(NEWSPAPER.ink)
    const mast = fm.title.toUpperCase()
    doc.text(mast, storyX, y, { lineBreak: false })
    y += compact ? mm(7) : mm(9.5)
  }

  const leftBit = (fm.date ?? fm.from ?? '').toUpperCase()
  const rightBit = (fm.from && fm.date ? fm.from : fm.to ?? '').toUpperCase()
  doc.font(FONT.sans).fontSize(6.5).fillColor(NEWSPAPER.ink).fillOpacity(0.75)
  if (leftBit) {
    doc.text(leftBit, storyX, y, { lineBreak: false, characterSpacing: isAscii(leftBit) ? 0.4 : 0 })
  }
  if (rightBit) {
    const rw = doc.widthOfString(rightBit)
    doc.text(rightBit, storyX + storyW - rw, y, { lineBreak: false })
  }
  doc.fillOpacity(1)
  y += mm(4.2)
  rules(doc, storyX, y, storyW)
  y += mm(4)

  if (fm.eyebrow && !running) {
    doc.font(FONT.sansBold).fontSize(6).fillColor(NEWSPAPER.kicker)
    doc.text(fm.eyebrow.toUpperCase(), storyX, y, {
      lineBreak: false,
      characterSpacing: isAscii(fm.eyebrow) ? 1.2 : 0,
    })
    y += mm(4)
  }

  if (headline && !running) {
    const hSize = kind === 'headline' ? (compact ? 16 : 22) : compact ? 12 : 15
    const lines = wrapSpans(
      doc,
      headline.map((span) => ({ ...span, bold: true })),
      storyW,
      'serif',
      hSize,
    )
    const row = hSize * 1.08
    for (const line of lines) {
      drawLine(doc, line, storyX, y, storyW, 'serif', hSize, NEWSPAPER.ink, 'left')
      y += row
    }
    y += mm(2)
    doc.save()
    doc.strokeColor(NEWSPAPER.rule).lineWidth(kind === 'headline' ? 1.1 : 0.45)
    doc
      .moveTo(storyX, y)
      .lineTo(storyX + storyW, y)
      .stroke()
    doc.restore()
    y += mm(3.2)
  } else if (kind === 'headline' && !running) {
    const hSize = compact ? 16 : 22
    const lines = wrapSpans(doc, [{ text: fm.title, bold: true }], storyW, 'serif', hSize)
    const row = hSize * 1.08
    for (const line of lines) {
      drawLine(doc, line, storyX, y, storyW, 'serif', hSize, NEWSPAPER.ink, 'left')
      y += row
    }
    y += mm(5)
  }

  const adY = innerBottom - adH - qrGap
  const col1: FlowBox = {
    x: storyX,
    y,
    width: columns === 2 ? colW : storyW,
    maxY: adY - mm(2),
  }
  const col2: FlowBox = {
    x: storyX + colW + colGap,
    y,
    width: colW,
    maxY: columns === 2 ? adY - mm(2) : y,
  }
  if (columns === 2) columnRule(doc, col2.x - colGap * 0.5, y, Math.min(adY - mm(1), y + bodyH))

  if (withAds) drawClassifieds(doc, storyX, adY, storyW, adH, hashString(`${fm.title}|ads`))

  doc.restore()

  const layout: ClipLayout = { col1, col2, columns }
  if (fm.qr) {
    layout.qr = {
      x: storyX + (storyW - qrSize) / 2,
      y: innerBottom - qrSize,
      size: qrSize,
    }
  }
  return layout
}

function drawClippingNewspaper(doc: PDFDoc, prop: PropDocument, page: PageBox, kind: ClipKind): void {
  const { headline, body } = splitHeadline(prop.blocks)
  let layout = paintClippingChrome(doc, prop, page, false, headline, body, kind)
  const onNewPage = (): ClipCols => {
    addSameSizePage(doc, page.width, page.height)
    layout = paintClippingChrome(doc, prop, page, true, headline, body, kind)
    return { col1: layout.col1, col2: layout.col2 }
  }

  doc.fillOpacity(1)
  placeColumns(
    { col1: layout.col1, col2: layout.col2 },
    onNewPage,
    columnRows(doc, body, layout.col1.width),
    layout.columns,
  )

  if (layout.qr) {
    drawQr(doc, prop.frontmatter.qr ?? '', layout.qr.x, layout.qr.y, layout.qr.size, {
      module: NEWSPAPER.ink,
      bg: NEWSPAPER.aged,
    })
  }
}

function drawPlainNewspaper(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const margin = mm(compact ? 8 : 10)
  const qrSize = mm(QR_MM)
  const footerReserve = mm(fm.qr ? 26 : 12)

  const paint = (running: boolean): FlowBox => {
    doc.rect(0, 0, page.width, page.height).fill(NEWSPAPER.paper)
    const innerX = margin
    const innerW = page.width - 2 * margin
    let y = margin + mm(compact ? 4 : 5)

    if (fm.eyebrow && !running) {
      doc.font(FONT.sansBold).fontSize(7).fillColor(NEWSPAPER.kicker)
      doc.text(fm.eyebrow.toUpperCase(), innerX, y, {
        width: innerW,
        align: 'center',
        characterSpacing: isAscii(fm.eyebrow) ? 1.8 : 0,
      })
      y += mm(5)
    }

    doc.font(FONT.serifBold).fontSize(compact ? 16 : 22).fillColor(NEWSPAPER.ink)
    doc.text(fm.title.toUpperCase(), innerX, y, { width: innerW, align: 'center' })
    y += compact ? mm(12) : mm(16)

    rules(doc, innerX, y, innerW)
    y += mm(5)

    if (!running) {
      const bits = [fm.from, fm.date, fm.to].filter(Boolean)
      if (bits.length) {
        doc.font(FONT.sans).fontSize(8).fillColor(NEWSPAPER.ink).fillOpacity(0.7)
        doc.text(bits.join('  ·  ').toUpperCase(), innerX, y, { width: innerW, align: 'center' })
        doc.fillOpacity(1)
        y += mm(6)
        rules(doc, innerX, y, innerW)
        y += mm(6)
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
      family: 'serif',
      color: NEWSPAPER.ink,
      align: 'left',
      paragraphSize: compact ? 8.5 : 10,
      headingSize: compact ? 11 : 12.5,
      lineHeight: 1.34,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = (page.width - qrSize) / 2
    const qy = page.height - margin - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: NEWSPAPER.ink, bg: NEWSPAPER.paper })
  }
}

export function drawNewspaper(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const kind = clipKind(prop.frontmatter.theme)
  if (kind === 'plain') drawPlainNewspaper(doc, prop, page)
  else drawClippingNewspaper(doc, prop, page, kind)
}
