import type { Block, Inline } from './types.js'

export function parseInlines(input: string, warnings: string[]): Inline[] {
  const spans: Inline[] = []
  let buf = ''
  let i = 0
  let bold = false
  let italic = false
  let mono = false

  const flush = (): void => {
    if (!buf) return
    const span: Inline = { text: buf }
    if (bold) span.bold = true
    if (italic) span.italic = true
    if (mono) span.mono = true
    spans.push(span)
    buf = ''
  }

  while (i < input.length) {
    const ch = input[i]
    if (ch === '\\' && i + 1 < input.length) {
      buf += input[i + 1]
      i += 2
      continue
    }

    if (!mono && input.startsWith('![', i)) {
      const match = input.slice(i).match(/^!\[([^\]]*)\]\(([^)]*)\)/)
      if (match) {
        flush()
        const alt = (match[1] ?? '').trim()
        const url = (match[2] ?? '').trim()
        warnings.push(`Imagem ignorada (MVP): ${url || alt || '(sem alt)'}`)
        if (alt) spans.push({ text: alt, italic: true })
        i += match[0].length
        continue
      }
    }

    if (!mono && ch === '[') {
      const match = input.slice(i).match(/^\[([^\]]+)\]\(([^)]*)\)/)
      if (match) {
        flush()
        const span: Inline = { text: match[1] ?? '' }
        if (bold) span.bold = true
        if (italic) span.italic = true
        spans.push(span)
        i += match[0].length
        continue
      }
    }

    if (ch === '`') {
      flush()
      mono = !mono
      i += 1
      continue
    }

    if (!mono && input.startsWith('**', i)) {
      flush()
      bold = !bold
      i += 2
      continue
    }

    if (!mono && ch === '*') {
      flush()
      italic = !italic
      i += 1
      continue
    }

    buf += ch
    i += 1
  }

  flush()
  return spans.filter((span) => span.text.length > 0)
}

function headingLevel(line: string): 1 | 2 | 3 | null {
  const match = line.match(/^(#{1,3})\s+(.+)$/)
  if (!match) return null
  const n = match[1]?.length ?? 0
  if (n === 1 || n === 2 || n === 3) return n
  return null
}

function listItem(line: string): { ordered: boolean; rest: string } | null {
  const unordered = line.match(/^\s*[-*+]\s+(.+)$/)
  if (unordered) return { ordered: false, rest: unordered[1] ?? '' }
  const ordered = line.match(/^\s*\d+\.\s+(.+)$/)
  if (ordered) return { ordered: true, rest: ordered[1] ?? '' }
  return null
}

function isHr(line: string): boolean {
  return /^(?:-{3,}|\*{3,}|_{3,})$/.test(line.trim())
}

export function parseMarkdown(body: string): { blocks: Block[]; warnings: string[] } {
  const warnings: string[] = []
  const lines = body.replace(/\r\n/g, '\n').split('\n')
  const blocks: Block[] = []
  let para: string[] = []
  let quote: string[] = []
  let list: { ordered: boolean; items: string[] } | null = null

  const flushPara = (): void => {
    if (!para.length) return
    const text = para.join(' ').trim()
    para = []
    if (!text) return
    blocks.push({ type: 'paragraph', inlines: parseInlines(text, warnings) })
  }

  const flushQuote = (): void => {
    if (!quote.length) return
    const text = quote.join(' ').trim()
    quote = []
    if (!text) return
    blocks.push({ type: 'quote', inlines: parseInlines(text, warnings) })
  }

  const flushList = (): void => {
    if (!list) return
    blocks.push({
      type: 'list',
      ordered: list.ordered,
      items: list.items.map((item) => parseInlines(item, warnings)),
    })
    list = null
  }

  const flushAll = (): void => {
    flushPara()
    flushQuote()
    flushList()
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '')
    const trimmed = line.trim()

    if (!trimmed) {
      flushAll()
      continue
    }

    if (isHr(trimmed)) {
      flushAll()
      blocks.push({ type: 'hr' })
      continue
    }

    const heading = headingLevel(trimmed)
    if (heading) {
      flushAll()
      const rest = trimmed.replace(/^#{1,3}\s+/, '')
      blocks.push({ type: 'heading', level: heading, inlines: parseInlines(rest, warnings) })
      continue
    }

    if (trimmed.startsWith('>')) {
      flushPara()
      flushList()
      quote.push(trimmed.replace(/^>\s?/, ''))
      continue
    }

    const item = listItem(line)
    if (item) {
      flushPara()
      flushQuote()
      if (!list || list.ordered !== item.ordered) {
        flushList()
        list = { ordered: item.ordered, items: [] }
      }
      list.items.push(item.rest)
      continue
    }

    if (list && /^\s{2,}\S/.test(line)) {
      const last = list.items.length - 1
      if (last >= 0) {
        list.items[last] = `${list.items[last]} ${trimmed}`
        continue
      }
    }

    if (quote.length && /^\s{2,}\S/.test(line)) {
      quote.push(trimmed)
      continue
    }

    flushQuote()
    flushList()
    para.push(trimmed)
  }

  flushAll()
  return { blocks, warnings }
}
