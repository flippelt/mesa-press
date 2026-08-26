export const TEMPLATES = [
  'letter',
  'poster',
  'dataslate',
  'plate',
  'telegram',
  'dossier',
  'edict',
  'newspaper',
  'ticket',
  'envelope',
  'postcard',
  'check',
  'report',
] as const
export const PAGE_SIZE_NAMES = ['a5', 'a6'] as const
export const SEALS = ['crimson', 'gold', 'green', 'charcoal', 'none'] as const
export const THEMES = [
  'vellum',
  'imperial',
  'amber',
  'iron',
  'brass',
  'gunmetal',
  'clipping',
  'column',
  'headline',
] as const

export type TemplateName = (typeof TEMPLATES)[number]
export type PageSizeName = (typeof PAGE_SIZE_NAMES)[number]
export type SealName = (typeof SEALS)[number]
export type ThemeName = (typeof THEMES)[number]

export interface Frontmatter {
  template: TemplateName
  size: PageSizeName
  title: string
  from?: string
  to?: string
  date?: string
  seal: SealName
  qr?: string
  eyebrow?: string
  theme: ThemeName
}

export interface Inline {
  text: string
  bold?: boolean
  italic?: boolean
  mono?: boolean
}

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3; inlines: Inline[] }
  | { type: 'paragraph'; inlines: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'quote'; inlines: Inline[] }
  | { type: 'hr' }

export interface PropDocument {
  frontmatter: Frontmatter
  body: string
  blocks: Block[]
  warnings: string[]
  sourcePath?: string
}
