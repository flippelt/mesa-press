import { describe, expect, it } from 'vitest'
import { parseInlines, parseMarkdown } from './markdown.js'

describe('parseMarkdown', () => {
  it('marca negrito e itálico', () => {
    const { blocks } = parseMarkdown('Um **negrito** e *itálico*.')
    const para = blocks[0]
    expect(para?.type).toBe('paragraph')
    if (para?.type !== 'paragraph') return
    expect(para.inlines.some((s) => s.bold && s.text === 'negrito')).toBe(true)
    expect(para.inlines.some((s) => s.italic && s.text === 'itálico')).toBe(true)
  })

  it('junta continuação indentada de item de lista', () => {
    const { blocks } = parseMarkdown(`- Lyra voltou com menos gente
  do que partiu.
`)
    expect(blocks).toHaveLength(1)
    const list = blocks[0]
    expect(list?.type).toBe('list')
    if (list?.type !== 'list') return
    expect(list.items).toHaveLength(1)
    expect(list.items[0]?.map((s) => s.text).join('')).toMatch(/gente do que partiu/)
  })

  it('parseInlines avisa imagem', () => {
    const warnings: string[] = []
    const spans = parseInlines('veja ![alt](x.png)', warnings)
    expect(warnings[0]).toMatch(/Imagem ignorada/)
    expect(spans.some((s) => s.text === 'alt' && s.italic)).toBe(true)
  })
})
