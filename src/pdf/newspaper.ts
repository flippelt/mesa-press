import { NEWSPAPER } from '../tokens.js'
import type { PropDocument } from '../types.js'
import { addSameSizePage } from './document.js'
import { FONT, isAscii } from './fonts.js'
import type { PDFDoc } from './pdfkit.js'
import { drawQr } from './qr.js'
import { mm, QR_MM, type PageBox } from './sizes.js'
import { flowBlocks, type FlowBox } from './text.js'

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
  doc.strokeColor(NEWSPAPER.rule).opacity(0.55)
  doc.lineWidth(0.7)
  doc
    .moveTo(x, y0)
    .lineTo(x, y1)
    .stroke()
  doc.lineWidth(0.3)
  doc
    .moveTo(x + 1.6, y0)
    .lineTo(x + 1.6, y1)
    .stroke()
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
  doc.fillColor(NEWSPAPER.stain).fillOpacity(0.07)
  doc.circle(x + mm(10), y + mm(14), mm(12)).fill()
  doc.fillOpacity(0.06)
  doc.circle(x + w - mm(8), y + h - mm(18), mm(14)).fill()
  doc.strokeColor(NEWSPAPER.stain).fillOpacity(1).opacity(0.12).lineWidth(1.1)
  doc.circle(x + w * 0.78, y + h * 0.28, mm(9)).stroke()
  doc.lineWidth(0.5)
  doc.circle(x + w * 0.78, y + h * 0.28, mm(7.4)).stroke()
  doc.restore()
}

function paintClippingChrome(
  doc: PDFDoc,
  prop: PropDocument,
  page: PageBox,
  running: boolean,
): FlowBox {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const edge = mm(compact ? 3.2 : 4.5)
  const sideW = compact ? mm(15.5) : mm(23)
  const gap = mm(compact ? 2.6 : 3.6)
  const qrSize = mm(compact ? 16 : QR_MM)
  const footerReserve = mm(fm.qr ? 6 : 4) + (fm.qr ? qrSize : 0)

  doc.rect(0, 0, page.width, page.height).fill(NEWSPAPER.aged)
  stainClippings(doc, 0, 0, page.width, page.height)

  const innerW = page.width - 2 * edge
  const leftX = edge
  const mainX = edge + sideW + gap
  const mainW = innerW - 2 * sideW - 2 * gap
  const rightX = mainX + mainW + gap
  const colBottom = page.height

  drawFillerColumn(
    doc,
    NEWSPAPER_FILLERS,
    leftX,
    0,
    sideW,
    colBottom,
    hashString(`${fm.title}|L|${running ? 1 : 0}`),
  )
  drawFillerColumn(
    doc,
    NEWSPAPER_FILLERS,
    rightX,
    0,
    sideW,
    colBottom,
    hashString(`${fm.title}|R|${running ? 1 : 0}`),
  )

  columnRule(doc, mainX - gap * 0.55, mm(2), page.height - mm(2))
  columnRule(doc, rightX - gap * 0.55, mm(2), page.height - mm(2))

  let y = edge + mm(compact ? 1 : 2)
  if (fm.eyebrow && !running) {
    doc.font(FONT.sansBold).fontSize(6.5).fillColor(NEWSPAPER.kicker)
    doc.text(fm.eyebrow.toUpperCase(), mainX, y, {
      width: mainW,
      align: 'center',
      characterSpacing: isAscii(fm.eyebrow) ? 1.4 : 0,
    })
    y += mm(4.4)
  }

  doc.font(FONT.serifBold).fontSize(compact ? 13 : 16).fillColor(NEWSPAPER.ink)
  doc.text(fm.title.toUpperCase(), mainX, y, { width: mainW, align: 'center' })
  y += compact ? mm(9) : mm(12)

  rules(doc, mainX, y, mainW)
  y += mm(4.2)

  if (!running) {
    const bits = [fm.from, fm.date, fm.to].filter(Boolean)
    if (bits.length) {
      doc.font(FONT.sans).fontSize(7).fillColor(NEWSPAPER.ink).fillOpacity(0.7)
      doc.text(bits.join('  ·  ').toUpperCase(), mainX, y, { width: mainW, align: 'center' })
      doc.fillOpacity(1)
      y += mm(5)
      rules(doc, mainX, y, mainW)
      y += mm(5)
    }
  }

  return {
    x: mainX,
    y,
    width: mainW,
    maxY: page.height - edge - footerReserve,
  }
}

function drawClippingNewspaper(doc: PDFDoc, prop: PropDocument, page: PageBox): void {
  const { frontmatter: fm } = prop
  const compact = page.name === 'a6'
  const qrSize = mm(compact ? 16 : QR_MM)

  let box = paintClippingChrome(doc, prop, page, false)
  const onNewPage = (): Pick<FlowBox, 'y' | 'maxY'> => {
    addSameSizePage(doc, page.width, page.height)
    box = paintClippingChrome(doc, prop, page, true)
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
      paragraphSize: compact ? 8 : 9.2,
      headingSize: compact ? 10 : 11.5,
      lineHeight: 1.32,
    },
    onNewPage,
  )

  if (fm.qr) {
    const qx = box.x + (box.width - qrSize) / 2
    const qy = page.height - mm(compact ? 5 : 6) - qrSize
    drawQr(doc, fm.qr, qx, qy, qrSize, { module: NEWSPAPER.ink, bg: NEWSPAPER.aged })
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
  if (prop.frontmatter.theme === 'clipping') drawClippingNewspaper(doc, prop, page)
  else drawPlainNewspaper(doc, prop, page)
}
