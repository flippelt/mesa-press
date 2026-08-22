/// <reference types="pdfkit" />
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export type PDFDoc = PDFKit.PDFDocument
export type PDFDocOptions = PDFKit.PDFDocumentOptions

type PDFDocumentCtor = {
  new (options?: PDFDocOptions): PDFDoc
}

const loaded = require('pdfkit') as PDFDocumentCtor | { default: PDFDocumentCtor }

export const PDFDocument = ('default' in loaded ? loaded.default : loaded) as PDFDocumentCtor
