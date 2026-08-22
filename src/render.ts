import { readFile } from 'node:fs/promises'
import { MesaPressError } from './errors.js'
import { parsePropSource } from './parse.js'
import { createDocument, finalize } from './pdf/document.js'
import { drawDataslate } from './pdf/dataslate.js'
import { drawLetter } from './pdf/letter.js'
import { drawPoster } from './pdf/poster.js'
import { PAGE_SIZES } from './pdf/sizes.js'
import { slugFromFilename } from './slug.js'
import type { PropDocument } from './types.js'

export async function renderToBuffer(prop: PropDocument): Promise<Buffer> {
  const page = PAGE_SIZES[prop.frontmatter.size]
  const doc = createDocument({
    width: page.width,
    height: page.height,
    title: prop.frontmatter.title,
  })

  switch (prop.frontmatter.template) {
    case 'letter':
      drawLetter(doc, prop, page)
      break
    case 'poster':
      drawPoster(doc, prop, page)
      break
    case 'dataslate':
      drawDataslate(doc, prop, page)
      break
    default: {
      const never: never = prop.frontmatter.template
      throw new MesaPressError(`Template desconhecido: ${String(never)}`)
    }
  }

  return finalize(doc)
}

export async function renderFile(inputPath: string): Promise<{
  buffer: Buffer
  prop: PropDocument
  slug: string
}> {
  const source = await readFile(inputPath, 'utf8')
  const prop = parsePropSource(source, inputPath)
  const buffer = await renderToBuffer(prop)
  return { buffer, prop, slug: slugFromFilename(inputPath) }
}
