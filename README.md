# mesa-press

[![CI](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml/badge.svg)](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/flippelt/mesa-press)](./LICENSE)

Motor de impressão: Markdown com frontmatter YAML → PDF **A5** ou **A6**
(carta, cartaz, dataslate, placa, telegrama, dossiê, édito, jornal ou
passagem). Você passa o arquivo; o CLI gera o PDF.

Irmão impresso do [rpg-prop-kit](https://github.com/flippelt/rpg-prop-kit).
O QR opcional pode apontar para o [campaign-codex](https://github.com/flippelt/campaign-codex)
ou para o [Immersive Terminal](https://github.com/flippelt/Immersive-Terminal-for-RPGs).

> ⚠️ **Status:** `v0.2.0`. API pode mudar.

## Requisitos

- Node.js 22 ou superior

```bash
git clone https://github.com/flippelt/mesa-press.git
cd mesa-press
npm ci
npm run build
```

## Uso

```bash
npx mesa-press render input.md --out out.pdf
npx mesa-press render input.md --out dir/
npx mesa-press render examples/*.md --out dist/pdfs/
```

- `--out arquivo.pdf` — grava nesse caminho (um único input).
- `--out dir/` ou `--out dir` — grava `dir/<slug>.pdf`. O slug vem do
  nome do arquivo (`carta-vigia.md` → `carta-vigia.pdf`).
- Vários inputs exigem um diretório de saída.

Sai com código **1** se faltar `template`/`title`, se o template for
desconhecido, ou se o arquivo não existir.

```bash
npm test
npm run build
npm run render:examples
```

O último comando gera PDFs em `dist/pdfs/` (gitignored).

## Frontmatter

```yaml
---
template: letter | poster | dataslate | plate | telegram | dossier | edict | newspaper | ticket | envelope | postcard | check | report
size: a5 | a6
title: string
from?: string
to?: string
date?: string
seal?: crimson | gold | green | charcoal | none
qr?: string
eyebrow?: string
theme?: vellum | imperial | amber | iron | brass | gunmetal | clipping | column | headline
---

Corpo em Markdown. **negrito**, *itálico*, headings, listas e parágrafos.
Imagens (`![alt](url)`) são ignoradas no MVP, com aviso no stderr.
```

| Campo      | Obrigatório | Padrão     | Notas |
| ---------- | ----------- | ---------- | ----- |
| `template` | sim         | —          | ver lista abaixo |
| `title`    | sim         | —          | Título no prop |
| `size`     | não         | `a5`       | `a5` ou `a6`, sempre retrato |
| `from`     | não         | —          | Remetente / origem |
| `to`       | não         | —          | Destinatário |
| `date`     | não         | —          | Data livre (não precisa ser ISO) |
| `seal`     | não         | `none`     | Selo de cera (carta e édito) |
| `qr`       | não         | —          | URL ou texto. QR 20 mm |
| `eyebrow`  | não         | —          | Tarja / classificação / seção |
| `theme`    | não         | ver abaixo | `imperial`/`amber` no dataslate; `iron`/`brass`/`gunmetal` na placa; `clipping`/`column`/`headline` no jornal; `vellum` no resto |

`theme` no dataslate escolhe o fósforo (`imperial` verde, `amber` âmbar).
Na **placa**, escolhe o metal. No **jornal**: `clipping` (padrão, recorte
com vizinhos e anúncios), `column` (uma coluna), `headline` (manchete),
`vellum` (página limpa).

## Tamanhos

Retrato, em pontos PDF (1 mm = 72/25.4):

| Formato | milímetros | uso típico |
| ------- | ---------- | ---------- |
| A5      | 148 × 210  | carta, cartaz, dataslate na mesa |
| A6      | 105 × 148  | bilhete, convite, ficha de bolso |

O **dataslate** também é retrato, com moldura/bezel desenhada na página.
Não gira para paisagem no MVP.

## Templates

**letter** — carta em velino. Margem, borda dupla, título centralizado,
bloco De/Para/Data, corpo em serifada, selo de cera opcional no canto
inferior direito, QR no inferior esquerdo.

**poster** — aviso / procurado. Moldura grossa dupla, `eyebrow` em oxblood,
título grande tipo xilogravura, corpo centralizado, rodapé com data.
Duas manchas suaves nos cantos. QR no centro inferior.

**dataslate** — tablet sci-fi. Página escura, bezel, barra `:: DATASLATE ::`,
título e corpo em monoespaçada. QR em módulos invertidos (fósforo no fundo
escuro). `theme: imperial` (padrão) ou `amber`.

**plate** — placa de metal (rebites, degradê). `theme: iron` (padrão), `brass`
ou `gunmetal`. Bom para aviso de setor / porta.

**telegram** — ficha de telégrafo (DE/PARA, carimbo do `eyebrow`, corpo
monoespaçado em linhas). QR no canto.

**dossier** — pasta manila com aba, carimbo diagonal do `eyebrow`, ficha
ORIGEM/DESTINO/DATA.

**edict** — decreto. Moldura dourada, título central, selo de cera opcional.
`eyebrow` padrão: POR DECRETO.

**newspaper** — recorte de jornal (papel cinza, borda irregular).
`clipping` (padrão) inclui vizinhos e anúncios; `column` é uma coluna
só; `headline` é manchete; `vellum` é a página limpa. QR no rodapé.

**ticket** — passagem com talão perfurado à esquerda. `from`/`to` viram DE/PARA;
QR no talão. Cai bem em A6.

**envelope** — envelope com aba, remetente, destinatário e selo. `eyebrow: aéreo`
(ou airmail) desenha as listras. QR no selo.

**postcard** — cartão postal: recado à esquerda, endereço à direita, selo.
Cai bem em A6.

**check** — cheque. `title` é o banco, `to` o beneficiário, `from` assina,
`eyebrow` o valor. O corpo vira a quantia por extenso.

**report** — ficha datilografada. `eyebrow` vira o carimbo (CONFIDENCIAL, etc.).

Fontes empacotadas em `fonts/` (sem baixar na hora):
Liberation (corpo geral), Old Standard (jornal), Crimson Text (carta),
Special Elite (telegrama e relatório), Pinyon Script (assinatura).
SIL OFL, salvo Special Elite (Apache 2.0). Sem as AFM do PDFKit
(elas partem acentos do português).

Metadados do PDF: `Title` = título do prop, `Author` = Felipe Lippelt,
`Creator` = mesa-press.

## Exemplos

Um Markdown por template em `examples/`:

| Arquivo | Template |
| ------- | -------- |
| `examples/carta-vigia.md` | letter |
| `examples/cartaz-fenda.md` | poster |
| `examples/dataslate-union.md` | dataslate |
| `examples/placa-setor.md` | plate |
| `examples/telegrama-vigia.md` | telegram |
| `examples/dossie-corvo.md` | dossier |
| `examples/edito-fenda.md` | edict |
| `examples/jornal-fenda.md` | newspaper |
| `examples/passagem-valdoran.md` | ticket |
| `examples/envelope-aereo.md` | envelope |
| `examples/cartao-postal.md` | postcard |
| `examples/cheque-praca.md` | check |
| `examples/relatorio.md` | report |

## Família

| Projeto | Papel |
|---|---|
| [rpg-prop-kit](https://www.npmjs.com/package/rpg-prop-kit) | as mesmas linguagens visuais, na tela |
| [session-kit](https://github.com/flippelt/session-kit) | YAML de sessão → Markdown destes templates |
| [Campaign Codex](https://github.com/flippelt/campaign-codex) | QR opcional aponta pro códice |

## Licença

MIT © 2026 Felipe Lippelt. Ver [LICENSE](./LICENSE). As fontes Liberation
em `fonts/` são SIL OFL (`fonts/LICENSE-LIBERATION`).
