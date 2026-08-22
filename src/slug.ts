import { basename } from 'node:path'
import { MesaPressError } from './errors.js'

export function slugFromFilename(filePath: string): string {
  const base = basename(filePath).replace(/\.[^.]+$/, '')
  const slug = base
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  if (!slug) {
    throw new MesaPressError(`Não foi possível derivar slug de: ${filePath}`)
  }
  return slug
}
