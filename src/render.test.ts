import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parsePropSource } from './parse.js'
import { renderFile, renderToBuffer } from './render.js'
import { slugFromFilename } from './slug.js'

const examplesDir = join(import.meta.dirname, '..', 'examples')
const tmpDir = join(import.meta.dirname, '..', 'tmp')

const examples = [
  { file: 'carta-vigia.md', word: 'Pedravale' },
  { file: 'cartaz-fenda.md', word: 'Fenda' },
  { file: 'dataslate-union.md', word: 'Comissariado' },
  { file: 'placa-setor.md', word: 'Pedravale' },
  { file: 'telegrama-vigia.md', word: 'Fenda' },
  { file: 'dossie-corvo.md', word: 'Corvo' },
  { file: 'edito-fenda.md', word: 'fosso' },
  { file: 'jornal-fenda.md', word: 'Pedravale' },
  { file: 'passagem-valdoran.md', word: 'Caravana' },
] as const

function extractText(pdfPath: string): string | null {
  try {
    return execFileSync('pdftotext', ['-enc', 'UTF-8', pdfPath, '-'], { encoding: 'utf8' })
  } catch {
    return null
  }
}

describe('render examples', () => {
  mkdirSync(tmpDir, { recursive: true })

  for (const example of examples) {
    it(`gera PDF de ${example.file} começando com %PDF`, async () => {
      const input = join(examplesDir, example.file)
      const { buffer, slug } = await renderFile(input)
      expect(slug).toBe(slugFromFilename(example.file))
      expect(buffer.subarray(0, 4).toString('utf8')).toBe('%PDF')
      const out = join(tmpDir, `${slug}.pdf`)
      writeFileSync(out, buffer)
      const text = extractText(out)
      if (text !== null) {
        expect(text).toMatch(new RegExp(example.word, 'i'))
        expect(text).not.toMatch(/Vigí\s+lia/)
        expect(text).not.toMatch(/Uni\s+ão/)
      }
    })
  }

  it('renderiza A6', async () => {
    const buffer = await renderToBuffer(
      parsePropSource(`---
template: poster
size: a6
title: Bilhete
eyebrow: Aviso
---
Texto curto da **Fenda**.
`),
    )
    expect(buffer.subarray(0, 4).toString('utf8')).toBe('%PDF')
  })

  it('PDF com qr fica maior do que sem qr', async () => {
    const source = `---
template: letter
title: Selo
---
Corpo curto.
`
    const without = await renderToBuffer(parsePropSource(source))
    const withQr = await renderToBuffer(
      parsePropSource(`---
template: letter
title: Selo
qr: https://example.com/mesa-press
---
Corpo curto.
`),
    )
    expect(without.subarray(0, 4).toString('utf8')).toBe('%PDF')
    expect(withQr.subarray(0, 4).toString('utf8')).toBe('%PDF')
    expect(withQr.length).toBeGreaterThan(without.length)
  })
})
