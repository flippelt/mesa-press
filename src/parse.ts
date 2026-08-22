import { parse as parseYaml } from 'yaml'
import { MesaPressError } from './errors.js'
import { parseMarkdown } from './markdown.js'
import {
  PAGE_SIZE_NAMES,
  SEALS,
  TEMPLATES,
  THEMES,
  type Frontmatter,
  type PageSizeName,
  type PropDocument,
  type SealName,
  type TemplateName,
  type ThemeName,
} from './types.js'

function asString(value: unknown): string | undefined {
  if (value == null) return undefined
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed.length ? trimmed : undefined
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return undefined
}

function splitFrontmatter(source: string): { yaml: string; body: string } {
  const match = source.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*\r?\n?([\s\S]*)$/)
  if (!match) {
    throw new MesaPressError('Frontmatter YAML ausente (delimitadores ---)')
  }
  return { yaml: match[1] ?? '', body: match[2] ?? '' }
}

function include<T extends string>(value: string, allowed: readonly T[], label: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T
  throw new MesaPressError(`${label} desconhecido: ${value} (use ${allowed.join(', ')})`)
}

export function parsePropSource(source: string, sourcePath?: string): PropDocument {
  const { yaml: rawYaml, body } = splitFrontmatter(source)
  let raw: Record<string, unknown>
  try {
    const parsed = parseYaml(rawYaml)
    if (parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new MesaPressError('Frontmatter YAML inválido (esperava um mapa)')
    }
    raw = parsed as Record<string, unknown>
  } catch (err) {
    if (err instanceof MesaPressError) throw err
    const msg = err instanceof Error ? err.message : String(err)
    throw new MesaPressError(`Frontmatter YAML inválido: ${msg}`)
  }

  const templateRaw = asString(raw.template)?.toLowerCase()
  if (!templateRaw) throw new MesaPressError('Campo obrigatório: template')
  const template = include<TemplateName>(templateRaw, TEMPLATES, 'Template')

  const title = asString(raw.title)
  if (!title) throw new MesaPressError('Campo obrigatório: title')

  const sizeRaw = asString(raw.size)?.toLowerCase() ?? 'a5'
  const size = include<PageSizeName>(sizeRaw, PAGE_SIZE_NAMES, 'Tamanho')

  const sealRaw = asString(raw.seal)?.toLowerCase() ?? 'none'
  const seal = include<SealName>(sealRaw, SEALS, 'Selo')

  const defaultTheme: ThemeName = template === 'dataslate' ? 'imperial' : 'vellum'
  const themeRaw = asString(raw.theme)?.toLowerCase() ?? defaultTheme
  const theme = include<ThemeName>(themeRaw, THEMES, 'Tema')

  const frontmatter: Frontmatter = {
    template,
    size,
    title,
    from: asString(raw.from),
    to: asString(raw.to),
    date: asString(raw.date),
    seal,
    qr: asString(raw.qr),
    eyebrow: asString(raw.eyebrow),
    theme,
  }

  const md = parseMarkdown(body)
  return {
    frontmatter,
    body,
    blocks: md.blocks,
    warnings: md.warnings,
    sourcePath,
  }
}
