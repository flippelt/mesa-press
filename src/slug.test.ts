import { describe, expect, it } from 'vitest'
import { slugFromFilename } from './slug.js'

describe('slugFromFilename', () => {
  it('usa o basename sem extensão', () => {
    expect(slugFromFilename('examples/carta-vigia.md')).toBe('carta-vigia')
    expect(slugFromFilename('/tmp/cartaz-fenda.md')).toBe('cartaz-fenda')
    expect(slugFromFilename('dataslate-union.MD')).toBe('dataslate-union')
  })

  it('normaliza espaços e acentos', () => {
    expect(slugFromFilename('Carta da Vigília.md')).toBe('carta-da-vigilia')
  })
})
