import { registerFonts } from './fonts.js'
import { PDFDocument, type PDFDoc } from './pdfkit.js'

export function createDocument(opts: {
  width: number
  height: number
  title: string
}): PDFDoc {
  const doc = new PDFDocument({
    size: [opts.width, opts.height],
    margin: 0,
    compress: true,
    autoFirstPage: true,
    info: {
      Title: opts.title,
      Author: 'Felipe Lippelt',
      Creator: 'mesa-press',
      Producer: 'mesa-press',
    },
  })
  registerFonts(doc)
  return doc
}

export function addSameSizePage(doc: PDFDoc, width: number, height: number): void {
  doc.addPage({ size: [width, height], margin: 0 })
}

export function finalize(doc: PDFDoc): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => {
      chunks.push(chunk)
    })
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}
