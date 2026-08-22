# mesa-press

[![CI](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml/badge.svg)](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/flippelt/mesa-press)](./LICENSE)

CLI que transforma um arquivo Markdown com frontmatter YAML em um PDF
**A5** ou **A6** pronto para imprimir e colocar na mesa: carta de pergaminho,
cartaz de aviso ou dataslate sci-fi.

Pensado para **props físicos** (handouts que o jogador segura). O QR opcional
pode apontar para uma entrada do [campaign-codex](https://github.com/flippelt/campaign-codex)
ou para um prompt no [Immersive Terminal](https://github.com/flippelt/Immersive-Terminal-for-RPGs).

Irmão impresso do [rpg-prop-kit](https://github.com/flippelt/rpg-prop-kit)
(props digitais CRT). A paleta analógica é a mesma família de tokens, hardcoded
neste repo — sem depender do pacote npm.

> ⚠️ **Status:** em desenvolvimento inicial (`v0.1.0`). API pode mudar.
> Texto real de campanha fica em repositórios **privados**. Os `examples/`
> deste repo são só demonstração pública (Valdoran / União genérica).

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
template: letter | poster | dataslate
size: a5 | a6
title: string
from?: string
to?: string
date?: string
seal?: crimson | gold | green | charcoal | none
qr?: string
eyebrow?: string
theme?: vellum | imperial | amber
---

Corpo em Markdown. **negrito**, *itálico*, headings, listas e parágrafos.
Imagens (`![alt](url)`) são ignoradas no MVP, com aviso no stderr.
```

| Campo      | Obrigatório | Padrão     | Notas |
| ---------- | ----------- | ---------- | ----- |
| `template` | sim         | —          | `letter`, `poster` ou `dataslate` |
| `title`    | sim         | —          | Título no prop |
| `size`     | não         | `a5`       | `a5` ou `a6`, sempre retrato |
| `from`     | não         | —          | Remetente / origem |
| `to`       | não         | —          | Destinatário |
| `date`     | não         | —          | Data livre (não precisa ser ISO) |
| `seal`     | não         | `none`     | Selo de cera no canto da carta |
| `qr`       | não         | —          | URL ou texto. QR 20 mm |
| `eyebrow`  | não         | —          | Tarja do cartaz (ex.: `PROCURADO`) ou kicker do dataslate |
| `theme`    | não         | ver abaixo | `vellum` nas cartas/cartazes; `imperial` ou `amber` no dataslate |

`theme` no dataslate escolhe o fósforo (`imperial` verde, `amber` âmbar).
Em `letter`/`poster` o tom de papel é sempre o pergaminho (`vellum`).

## Tamanhos

Retrato, em pontos PDF (1 mm = 72/25.4):

| Formato | milímetros | uso típico |
| ------- | ---------- | ---------- |
| A5      | 148 × 210  | carta, cartaz, dataslate na mesa |
| A6      | 105 × 148  | bilhete, convite, ficha de bolso |

O **dataslate** também é retrato, com moldura/bezel desenhada na página.
Não gira para paisagem no MVP.

## Templates

**letter** — carta em velino. Margem, borda dupla, título centralizado em
versaletes, bloco De/Para/Data, corpo em serifada (Times-Roman), selo de
cera opcional no canto inferior direito, QR no inferior esquerdo.

**poster** — aviso / procurado. Moldura grossa dupla, `eyebrow` em oxblood,
título grande tipo xilogravura, corpo centralizado, rodapé com data.
Duas manchas suaves nos cantos. QR no centro inferior.

**dataslate** — tablet sci-fi. Página escura, bezel, barra `:: DATASLATE ::`,
título e corpo em Courier. QR em módulos invertidos (fósforo no fundo
escuro).

Fontes: as padrão do PDF (Times-Roman nas cartas/cartazes, Courier no
dataslate, Helvetica nas etiquetas). Sem Google Fonts no MVP.

Metadados do PDF: `Title` = título do prop, `Author` = Felipe Lippelt,
`Creator` = mesa-press.

## Exemplos

| Arquivo | Template | Demo |
| ------- | -------- | ---- |
| `examples/carta-vigia.md` | letter | Relatório da Vigília de Pedravale (Valdoran) |
| `examples/cartaz-fenda.md` | poster | Aviso sobre a Grande Fenda |
| `examples/dataslate-union.md` | dataslate | Aviso administrativo da União (genérico) |

Valdoran é campanha de demonstração do campaign-codex. A União aqui é
casca genérica, não uma missão específica. **Não coloque lore privado
neste repositório.**

## Licença

MIT © 2026 Felipe Lippelt. Ver [LICENSE](./LICENSE).
