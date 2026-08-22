/** Paleta analógica hardcoded (família rpg-prop-kit). Sem dependência npm. */

export const VELLUM = {
  bg: '#e8d9b8',
  ink: '#3a2a18',
  rule: '#c4b08a',
  stain: '#7a4a1e',
} as const

export const WAX = {
  crimson: { fill: '#9c2a1c', dark: '#6e1810', highlight: '#be4d37' },
  gold: { fill: '#c9a227', dark: '#8a6a10', highlight: '#e8d48a' },
  green: { fill: '#2d6b32', dark: '#1a421c', highlight: '#5a9a52' },
  charcoal: { fill: '#3a3a38', dark: '#1c1c1a', highlight: '#6a6a64' },
} as const

export const POSTER = {
  paper: '#efe6c9',
  ink: '#1a140c',
  kicker: '#7a1f16',
  stain: '#7a4a1e',
} as const

export const DATASLATE = {
  imperial: {
    bg: '#0b0e0c',
    fg: '#7cff6b',
    muted: '#1a4a22',
    bezel: '#2a2f2c',
  },
  amber: {
    bg: '#0a0500',
    fg: '#ffb000',
    muted: '#5a3a00',
    bezel: '#2a1f14',
  },
} as const

export type WaxPalette = (typeof WAX)[keyof typeof WAX]
export type DataslatePalette = (typeof DATASLATE)[keyof typeof DATASLATE]
