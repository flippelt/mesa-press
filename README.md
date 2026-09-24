# mesa-press

[![CI](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml/badge.svg)](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/flippelt/mesa-press)](./LICENSE)
![node](https://img.shields.io/badge/node-%E2%89%A5%2022-339933)

CLI que transforma Markdown com frontmatter YAML em **PDF pronto para
imprimir** e entregar na mesa de RPG: carta com selo de cera, cartaz de
procurado, recorte de jornal, telegrama, dossiê, cheque, passagem e mais,
em **A5** ou **A6**.

- **13 templates**, cada um com moldura, tipografia e textura próprias.
- **Offline**: as fontes vêm empacotadas, nada é baixado na hora.
- **QR opcional** em qualquer template, para ligar o papel a algo na tela.
- **Acentos do português** funcionam (sem as fontes AFM do PDFKit).

É o irmão impresso do [rpg-prop-kit](https://github.com/flippelt/rpg-prop-kit).

> ⚠️ **Status:** `v0.2.0`. A API ainda pode mudar. Não está no npm; use a
> partir do clone.

## Começo rápido

Requer **Node.js 22** ou superior.

```bash
git clone https://github.com/flippelt/mesa-press.git
cd mesa-press
npm ci
npm run build
```

Escreva um arquivo, por exemplo `bilhete.md`:

```markdown
---
template: letter
size: a6
title: Um aviso
from: Um amigo
seal: crimson
---

Não confie no estalajadeiro. **Saia antes do amanhecer.**
```

E gere o PDF:

```bash
node dist/cli.js render bilhete.md --out bilhete.pdf
```

Para ver todos os templates de uma vez, gere os exemplos em `dist/pdfs/`:

```bash
npm run render:examples
```

## Uso

```bash
node dist/cli.js render <entrada.md...> --out <arquivo.pdf | diretório/>
```

| Forma | Resultado |
| --- | --- |
| `render a.md --out a.pdf` | grava exatamente nesse arquivo |
| `render a.md --out pdfs/` | grava `pdfs/a.pdf` (slug do nome do arquivo) |
| `render examples/*.md --out pdfs/` | um PDF por entrada; vários arquivos exigem diretório |

- `-o` é atalho de `--out`; `--out=caminho` também funciona.
- Globs são expandidos pelo próprio CLI, então funcionam também sem shell.
- O caminho de cada PDF gerado sai no stdout; avisos saem no stderr.
- Sai com código **1** em qualquer erro: arquivo inexistente, frontmatter
  ausente ou inválido, falta de `template`/`title`, valor desconhecido em
  `template`, `size`, `seal` ou `theme`.

> **Nota:** por enquanto, rode o CLI com `node dist/cli.js`. Chamado por
> symlink (`npx mesa-press`, `npm link`) ele termina sem gerar nada.

## Frontmatter

```yaml
---
template: letter      # obrigatório
title: Título do prop # obrigatório
size: a5              # a5 | a6
from: Remetente
to: Destinatário
date: Inverno do 12º ano
seal: crimson         # crimson | gold | green | charcoal | none
qr: https://exemplo.com
eyebrow: CONFIDENCIAL
theme: vellum         # depende do template, ver abaixo
---
```

| Campo | Obrigatório | Padrão | O que faz |
| --- | --- | --- | --- |
| `template` | sim | — | Um dos [templates](#templates) |
| `title` | sim | — | Título do prop (e `Title` nos metadados do PDF) |
| `size` | não | `a5` | `a5` ou `a6`, sempre retrato |
| `from` | não | — | Remetente / origem / assinatura |
| `to` | não | — | Destinatário |
| `date` | não | — | Texto livre, não precisa ser ISO |
| `seal` | não | `none` | Selo de cera: só em `letter` e `edict` |
| `qr` | não | — | URL ou texto; vira um QR no prop |
| `eyebrow` | não | — | Tarja, carimbo ou seção, conforme o template |
| `theme` | não | por template | Variação visual (tabela abaixo) |

### Temas

| Template | Temas | Padrão |
| --- | --- | --- |
| `dataslate` | `imperial` (fósforo verde), `amber` (âmbar) | `imperial` |
| `plate` | `iron`, `brass`, `gunmetal` | `iron` |
| `newspaper` | `clipping` (recorte com vizinhos e anúncios), `column` (uma coluna), `headline` (manchete), `vellum` (página limpa) | `clipping` |
| demais | `vellum` | `vellum` |

### Corpo em Markdown

Suportado: parágrafos, headings `#` a `###`, listas (com e sem número),
citações `>`, linha horizontal `---`, **negrito**, *itálico* e `código`
(monoespaçado).

- Links viram só o texto (papel não tem clique; use `qr` para isso).
- Imagens são ignoradas com aviso no stderr; o texto alternativo fica em
  itálico.
- Texto longo continua em páginas extras com a mesma moldura, exceto em
  `envelope` e `check`, que são peça única.

## Templates

| Template | O que é | `eyebrow` vira | Onde fica o QR |
| --- | --- | --- | --- |
| `letter` | Carta em velino, borda dupla, bloco De/Para/Data, assinatura, selo de cera opcional | — | canto inferior esquerdo |
| `poster` | Aviso / procurado: moldura grossa, título tipo xilogravura, manchas nos cantos | tarja acima do título | centro inferior |
| `dataslate` | Tablet sci-fi: página escura, bezel, texto monoespaçado | classificação | centro inferior, em fósforo |
| `plate` | Placa de metal com rebites e degradê; aviso de setor ou porta | tarja | centro inferior |
| `telegram` | Ficha de telégrafo, DE/PARA, corpo em linhas datilografadas | classe e carimbo (padrão: TELEGRAMA) | canto inferior direito da ficha |
| `dossier` | Pasta manila com aba e ficha ORIGEM/DESTINO/DATA | carimbo diagonal | canto inferior direito |
| `edict` | Decreto com moldura dourada, selo de cera opcional | linha acima do título (padrão: POR DECRETO) | canto inferior esquerdo |
| `newspaper` | Recorte de jornal em papel cinza, borda irregular | seção | centro do rodapé |
| `ticket` | Passagem com talão perfurado; `from`/`to` viram DE/PARA. Fica bem em A6 | rótulo (padrão: PASSAGEM) | no talão |
| `envelope` | Envelope com aba, remetente, destinatário e selo postal | `aéreo`/`airmail` desenha as listras | no selo |
| `postcard` | Cartão postal: recado à esquerda, endereço e selo à direita. Fica bem em A6 | texto do selo | lado do endereço |
| `check` | Cheque: `title` é o banco, `to` o beneficiário, `from` assina, corpo é a quantia por extenso | valor | canto inferior esquerdo |
| `report` | Ficha datilografada | carimbo (CONFIDENCIAL etc.) | canto inferior direito |

Há um exemplo de cada em [`examples/`](./examples), com o nome do arquivo
indicando o template (`carta-vigia.md` é `letter`, `jornal-fenda.md` é
`newspaper`, e assim por diante).

### Tamanhos

| Formato | Milímetros | Uso típico |
| --- | --- | --- |
| A5 | 148 × 210 | carta, cartaz, dataslate na mesa |
| A6 | 105 × 148 | bilhete, passagem, postal, ficha de bolso |

Tudo é retrato. O dataslate desenha a moldura dentro da página, sem girar
para paisagem.

## Uso como biblioteca

O build também exporta as funções do CLI (ESM). A partir do clone:

```ts
import { writeFile } from 'node:fs/promises'
import { parsePropSource, renderToBuffer } from './dist/index.js'

const prop = parsePropSource(markdownComFrontmatter)
await writeFile('prop.pdf', await renderToBuffer(prop))
```

Também exporta `renderFile(caminho)`, `parseMarkdown`, `slugFromFilename`,
`MesaPressError` e os tipos (`Frontmatter`, `TemplateName` etc.).

## Fontes

Empacotadas em [`fonts/`](./fonts):

| Família | Uso | Licença |
| --- | --- | --- |
| Liberation Serif/Sans/Mono | corpo geral | SIL OFL |
| Old Standard | jornal | SIL OFL |
| Crimson Text | carta e postal | SIL OFL |
| Special Elite | telegrama e relatório | Apache 2.0 |
| Pinyon Script | assinatura | SIL OFL |

Metadados do PDF: `Title` = título do prop, `Author` = Felipe Lippelt,
`Creator` = mesa-press.

## Desenvolvimento

```bash
npm test                 # vitest
npm run build            # tsc → dist/
npm run render:examples  # todos os exemplos → dist/pdfs/ (gitignored)
```

A CI roda `npm test` e `npm run build` no Node 22 a cada push e PR.

## Família

| Projeto | Papel |
| --- | --- |
| [rpg-prop-kit](https://www.npmjs.com/package/rpg-prop-kit) | as mesmas linguagens visuais, na tela |
| [session-kit](https://github.com/flippelt/session-kit) | YAML de sessão → Markdown destes templates |
| [Campaign Codex](https://github.com/flippelt/campaign-codex) | destino do QR: o códice da campanha |
| [Immersive Terminal](https://github.com/flippelt/Immersive-Terminal-for-RPGs) | outro destino do QR: terminal na tela |

## Licença

Código sob MIT © 2026 Felipe Lippelt, ver [LICENSE](./LICENSE). As fontes
têm licença própria (SIL OFL ou Apache 2.0), com os textos em
[`fonts/`](./fonts).
