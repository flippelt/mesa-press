#!/usr/bin/env node
import { existsSync, globSync, readFileSync, statSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { MesaPressError } from './errors.js'
import { renderFile } from './render.js'

const HELP = `mesa-press — Markdown → PDF de props de mesa

Uso:
  mesa-press render <entrada.md...> --out <arquivo.pdf|diretório/>

Opções:
  -o, --out       Arquivo .pdf ou diretório de saída
  -h, --help      Mostra esta ajuda
  -v, --version   Versão

Templates: letter, poster, dataslate, plate, telegram, dossier, edict, newspaper, ticket
Tamanhos: a5 (padrão), a6
`

function version(): string {
  const here = dirname(fileURLToPath(import.meta.url))
  const pkg = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8')) as {
    version: string
  }
  return pkg.version
}

function isPdfPath(path: string): boolean {
  return path.toLowerCase().endsWith('.pdf')
}

function looksLikeDirectory(out: string, multi: boolean): boolean {
  if (multi) return true
  if (out.endsWith('/') || out.endsWith('\\')) return true
  if (isPdfPath(out)) return false
  return !existsSync(out) || statSync(out).isDirectory()
}

function expandInputs(patterns: string[]): string[] {
  const out: string[] = []
  for (const pattern of patterns) {
    if (/[*?[\]{}]/.test(pattern)) {
      const matches = globSync(pattern).sort()
      if (!matches.length) {
        throw new MesaPressError(`Nenhum arquivo: ${pattern}`)
      }
      out.push(...matches)
      continue
    }
    if (!existsSync(pattern) || !statSync(pattern).isFile()) {
      throw new MesaPressError(`Arquivo não encontrado: ${pattern}`)
    }
    out.push(pattern)
  }
  return [...new Set(out)]
}

export async function run(argv: string[]): Promise<number> {
  try {
    await runUnsafe(argv)
    return 0
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    process.stderr.write(`mesa-press: ${msg}\n`)
    if (!(err instanceof MesaPressError) && err instanceof Error && err.stack) {
      process.stderr.write(`${err.stack}\n`)
    }
    return 1
  }
}

async function runUnsafe(argv: string[]): Promise<void> {
  if (argv.includes('-h') || argv.includes('--help')) {
    process.stdout.write(HELP)
    return
  }
  if (argv.includes('-v') || argv.includes('--version')) {
    process.stdout.write(`${version()}\n`)
    return
  }
  if (argv.length === 0) {
    process.stdout.write(HELP)
    throw new MesaPressError('informe o comando render')
  }

  const args = [...argv]
  const cmd = args.shift()
  if (cmd !== 'render') {
    throw new MesaPressError('Uso: mesa-press render <entrada.md...> --out <arquivo.pdf|diretório/>')
  }

  const inputs: string[] = []
  let out: string | undefined
  while (args.length) {
    const arg = args.shift() as string
    if (arg === '--out' || arg === '-o') {
      out = args.shift()
      if (!out) throw new MesaPressError('Faltou valor para --out')
      continue
    }
    if (arg.startsWith('--out=')) {
      out = arg.slice('--out='.length)
      if (!out) throw new MesaPressError('Faltou valor para --out')
      continue
    }
    if (arg.startsWith('-')) {
      throw new MesaPressError(`Opção desconhecida: ${arg}`)
    }
    inputs.push(arg)
  }

  if (!inputs.length) throw new MesaPressError('Informe ao menos um arquivo .md')
  if (!out) throw new MesaPressError('Informe --out (arquivo .pdf ou diretório)')

  const files = expandInputs(inputs)
  if (files.length > 1 && isPdfPath(out) && !out.endsWith('/') && !out.endsWith('\\')) {
    throw new MesaPressError('Vários arquivos exigem --out apontando para um diretório')
  }

  const dirMode = looksLikeDirectory(out, files.length > 1)

  for (const file of files) {
    const { buffer, prop, slug } = await renderFile(file)
    for (const warning of prop.warnings) {
      process.stderr.write(`mesa-press: aviso: ${warning}\n`)
    }
    const target = dirMode ? join(out, `${slug}.pdf`) : out
    const resolved = isAbsolute(target) ? target : resolve(target)
    await mkdir(dirname(resolved), { recursive: true })
    await writeFile(resolved, buffer)
    process.stdout.write(`${resolved}\n`)
  }
}

function isDirectRun(): boolean {
  const entry = process.argv[1]
  if (!entry) return false
  try {
    return pathToFileURL(resolve(entry)).href === import.meta.url
  } catch {
    return false
  }
}

if (isDirectRun()) {
  run(process.argv.slice(2)).then((code) => {
    process.exit(code)
  })
}
