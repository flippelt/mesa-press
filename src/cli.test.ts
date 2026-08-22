import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { run } from './cli.js'

const examplesDir = join(import.meta.dirname, '..', 'examples')
const repoTmp = join(import.meta.dirname, '..', 'tmp')

describe('cli', () => {
  it('grava dir/<slug>.pdf', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'mesa-press-'))
    const code = await run(['render', join(examplesDir, 'carta-vigia.md'), '--out', `${dir}/`])
    expect(code).toBe(0)
    const pdf = readFileSync(join(dir, 'carta-vigia.pdf'))
    expect(pdf.subarray(0, 4).toString('utf8')).toBe('%PDF')
  })

  it('sai 1 sem title', async () => {
    mkdirSync(repoTmp, { recursive: true })
    const missing = join(repoTmp, 'sem-titulo.md')
    writeFileSync(
      missing,
      `---
template: letter
---
corpo
`,
    )
    const dir = mkdtempSync(join(tmpdir(), 'mesa-press-'))
    const code = await run(['render', missing, '--out', dir])
    expect(code).toBe(1)
  })

  it('sai 1 com template desconhecido', async () => {
    mkdirSync(repoTmp, { recursive: true })
    const bad = join(repoTmp, 'template-ruim.md')
    writeFileSync(
      bad,
      `---
template: banana
title: X
---
corpo
`,
    )
    const dir = mkdtempSync(join(tmpdir(), 'mesa-press-'))
    const code = await run(['render', bad, '--out', dir])
    expect(code).toBe(1)
  })
})
