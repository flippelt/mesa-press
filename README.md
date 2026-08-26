# mesa-press

[![CI](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml/badge.svg)](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/flippelt/mesa-press)](./LICENSE)

CLI que transforma um arquivo Markdown com frontmatter YAML em um PDF
**A5** ou **A6** pronto para imprimir e colocar na mesa: carta, cartaz,
dataslate, placa de metal, telegrama, dossiê, édito, jornal ou passagem.

Pensado para **props físicos** (handouts que o jogador segura). O QR opcional
pode apontar para uma entrada do [campaign-codex](https://github.com/flippelt/campaign-codex)
ou para um prompt no [Immersive Terminal](https://github.com/flippelt/Immersive-Terminal-for-RPGs).

Irmão impresso do [rpg-prop-kit](https://github.com/flippelt/rpg-prop-kit)
(props digitais CRT). A paleta analógica é a mesma família de tokens, hardcoded
neste repo — sem depender do pacote npm.

> ⚠️ **Status:** em desenvolvimento inicial (`v0.1.0`). API pode mudar.

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
template: letter | poster | dataslate | plate | telegram | dossier | edict | newspaper | ticket
size: a5 | a6
title: string
from?: string
to?: string
date?: string
seal?: crimson | gold | green | charcoal | none
qr?: string
eyebrow?: string
theme?: vellum | imperial | amber | iron | brass | gunmetal
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
| `theme`    | não         | ver abaixo | `imperial`/`amber` no dataslate; `iron`/`brass`/`gunmetal` na placa; `vellum` no resto |

`theme` no dataslate escolhe o fósforo (`imperial` verde, `amber` âmbar).
Na **placa**, escolhe o metal. Nos outros templates o papel é fixo.

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

**telegram** — fita amarela, cabeçalho DE/PARA/EM em caixa alta, corpo
monoespaçado. `eyebrow` vira o carimbo do cabeçalho (`URGENTE`, etc.).

**dossier** — pasta manila com aba, carimbo diagonal do `eyebrow`, ficha
ORIGEM/DESTINO/DATA.

**edict** — decreto. Moldura dourada, título central, selo de cera opcional.
`eyebrow` padrão: POR DECRETO.

**newspaper** — recorte de jornal. Cabeçalho grande, filetes, data/origem
no meio.

**ticket** — passagem com talão perfurado à esquerda. `from`/`to` viram DE/PARA;
QR no talão. Cai bem em A6.

Fontes: [Liberation](https://github.com/liberationfonts/liberation-fonts)
(Serif / Sans / Mono) empacotadas em `fonts/` — SIL OFL, ver
`fonts/LICENSE-LIBERATION`. Sem Google Fonts. Sem as AFM padrão do PDFKit
(elas partem acentos do português).

Metadados do PDF: `Title` = título do prop, `Author` = Felipe Lippelt,
`Creator` = mesa-press.

## Exemplos

| Arquivo | Template | Demo |
| ------- | -------- | ---- |
| `examples/carta-vigia.md` | letter | Relatório da Vigília de Pedravale (Valdoran) |
| `examples/cartaz-fenda.md` | poster | Aviso sobre a Grande Fenda |
| `examples/dataslate-union.md` | dataslate | Aviso administrativo da União (genérico) |
| `examples/placa-setor.md` | plate | Placa do Setor 7-G |
| `examples/telegrama-vigia.md` | telegram | Cabo urgente da muralha |
| `examples/dossie-corvo.md` | dossier | Ficha do Mestre Corvo |
| `examples/edito-fenda.md` | edict | Decreto sobre a borda norte |
| `examples/jornal-fenda.md` | newspaper | Recorte da Folha de Pedravale |
| `examples/passagem-valdoran.md` | ticket | Passagem da caravana |

## Licença

MIT © 2026 Felipe Lippelt. Ver [LICENSE](./LICENSE). As fontes Liberation
em `fonts/` são SIL OFL (`fonts/LICENSE-LIBERATION`).
