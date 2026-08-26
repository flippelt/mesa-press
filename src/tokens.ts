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

export const METAL = {
  iron: { hi: '#d0d4da', mid: '#8b919a', lo: '#4a5158', ink: '#f3f5f7' },
  brass: { hi: '#e2c878', mid: '#b08a3a', lo: '#5a3e10', ink: '#1a1408' },
  gunmetal: { hi: '#6a7a86', mid: '#3e4a52', lo: '#1a2228', ink: '#d6e0e8' },
} as const

export const TELEGRAM = {
  paper: '#e8d090',
  ink: '#1a140c',
  bar: '#1a140c',
  urgent: '#9c2a1c',
  rule: '#3a2a10',
  muted: '#5a4a28',
} as const

export const DOSSIER = {
  folder: '#c4a56a',
  page: '#efe0c0',
  tab: '#a98448',
  ink: '#2a1c10',
  rule: '#8a6a38',
} as const

export const EDICT = {
  bg: '#efe4c4',
  ink: '#2c1c0c',
  gold: '#8a6a18',
  rule: '#c4b08a',
} as const

export const NEWSPAPER = {
  paper: '#e8e6e1',
  aged: '#e4e2dc',
  page: '#f4f3f0',
  ink: '#161616',
  rule: '#2a2a28',
  kicker: '#7a1f16',
  stain: '#6a6864',
  filler: '#3e3e3c',
} as const

export const ENVELOPE = {
  paper: '#efe6d2',
  ink: '#2a1c10',
  flap: '#e4d8be',
  stripeRed: '#9c2a1c',
  stripeBlue: '#2a4a7a',
  stamp: '#9c2a1c',
} as const

export const POSTCARD = {
  paper: '#e8e2d4',
  ink: '#1a1610',
  rule: '#6a6258',
  stamp: '#2d6b32',
} as const

export const CHECK = {
  paper: '#e4eee4',
  ink: '#1a2218',
  rule: '#7a9a7a',
  line: '#c5d6c5',
  bank: '#1a3a28',
} as const

export const REPORT = {
  paper: '#efe6d4',
  ink: '#1a140c',
  stamp: '#9c2a1c',
  hole: '#c4b090',
  rule: '#8a7a60',
} as const

export const TICKET = {
  paper: '#f7edd4',
  stub: '#ead7b0',
  ink: '#1a140c',
  accent: '#7a1f16',
  dash: '#6a5338',
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
export type MetalPalette = (typeof METAL)[keyof typeof METAL]
