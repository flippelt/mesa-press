import { describe, expect, it } from 'vitest'
import { MesaPressError } from './errors.js'
import { parsePropSource } from './parse.js'

describe('parseFrontmatter', () => {
  it('lê template, title e defaults', () => {
    const prop = parsePropSource(`---
template: letter
title: Relatório
---

Corpo com **Pedravale**.
`)
    expect(prop.frontmatter.template).toBe('letter')
    expect(prop.frontmatter.title).toBe('Relatório')
    expect(prop.frontmatter.size).toBe('a5')
    expect(prop.frontmatter.seal).toBe('none')
    expect(prop.frontmatter.theme).toBe('vellum')
    expect(prop.blocks[0]?.type).toBe('paragraph')
  })

  it('aplica tema iron por padrão na placa', () => {
    const prop = parsePropSource(`---
template: plate
title: Setor
---
ok
`)
    expect(prop.frontmatter.theme).toBe('iron')
  })

  it('aplica tema imperial por padrão no dataslate', () => {
    const prop = parsePropSource(`---
template: dataslate
title: Ping
---
ok
`)
    expect(prop.frontmatter.theme).toBe('imperial')
  })

  it('aplica tema clipping por padrão no jornal', () => {
    const prop = parsePropSource(`---
template: newspaper
title: A Folha
---
ok
`)
    expect(prop.frontmatter.theme).toBe('clipping')
  })

  it('falha sem title', () => {
    expect(() =>
      parsePropSource(`---
template: letter
---
x
`),
    ).toThrow(MesaPressError)
    expect(() =>
      parsePropSource(`---
template: letter
---
x
`),
    ).toThrow(/title/)
  })

  it('falha sem template', () => {
    expect(() =>
      parsePropSource(`---
title: Sem template
---
x
`),
    ).toThrow(/template/)
  })

  it('falha com template desconhecido', () => {
    expect(() =>
      parsePropSource(`---
template: flyer
title: X
---
x
`),
    ).toThrow(/desconhecido/)
  })

  it('avisa e ignora imagens', () => {
    const prop = parsePropSource(`---
template: poster
title: Cartaz
---
Antes ![mapa](mapa.png) depois.
`)
    expect(prop.warnings.some((w) => /Imagem ignorada/.test(w))).toBe(true)
  })
})
