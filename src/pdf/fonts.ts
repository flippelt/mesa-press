import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PDFDoc } from './pdfkit.js'

const fontsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../fonts')

export const FONT = {
  serif: 'MesaSerif',
  serifBold: 'MesaSerif-Bold',
  serifItalic: 'MesaSerif-Italic',
  serifBoldItalic: 'MesaSerif-BoldItalic',
  sans: 'MesaSans',
  sansBold: 'MesaSans-Bold',
  mono: 'MesaMono',
  monoBold: 'MesaMono-Bold',
  news: 'MesaNews',
  newsBold: 'MesaNews-Bold',
  newsItalic: 'MesaNews-Italic',
  letter: 'MesaLetter',
  letterBold: 'MesaLetter-Bold',
  letterItalic: 'MesaLetter-Italic',
  letterBoldItalic: 'MesaLetter-BoldItalic',
  typewriter: 'MesaTypewriter',
  script: 'MesaScript',
} as const

const FILES: Record<string, string> = {
  [FONT.serif]: 'LiberationSerif-Regular.ttf',
  [FONT.serifBold]: 'LiberationSerif-Bold.ttf',
  [FONT.serifItalic]: 'LiberationSerif-Italic.ttf',
  [FONT.serifBoldItalic]: 'LiberationSerif-BoldItalic.ttf',
  [FONT.sans]: 'LiberationSans-Regular.ttf',
  [FONT.sansBold]: 'LiberationSans-Bold.ttf',
  [FONT.mono]: 'LiberationMono-Regular.ttf',
  [FONT.monoBold]: 'LiberationMono-Bold.ttf',
  [FONT.news]: 'OldStandard-Regular.ttf',
  [FONT.newsBold]: 'OldStandard-Bold.ttf',
  [FONT.newsItalic]: 'OldStandard-Italic.ttf',
  [FONT.letter]: 'CrimsonText-Regular.ttf',
  [FONT.letterBold]: 'CrimsonText-Bold.ttf',
  [FONT.letterItalic]: 'CrimsonText-Italic.ttf',
  [FONT.letterBoldItalic]: 'CrimsonText-BoldItalic.ttf',
  [FONT.typewriter]: 'SpecialElite-Regular.ttf',
  [FONT.script]: 'PinyonScript-Regular.ttf',
}

/** Standard AFM fonts mangle Portuguese (í/ã/ç) once characterSpacing or wrap kicks in. */
export function registerFonts(doc: PDFDoc): void {
  for (const [name, file] of Object.entries(FILES)) {
    doc.registerFont(name, path.join(fontsDir, file))
  }
}

export function isAscii(text: string): boolean {
  return /^[\x00-\x7F]*$/.test(text)
}
