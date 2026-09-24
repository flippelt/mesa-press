# mesa-press

[![CI](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml/badge.svg)](https://github.com/flippelt/mesa-press/actions/workflows/ci.yml)
[![license](https://img.shields.io/github/license/flippelt/mesa-press)](./LICENSE)
![node](https://img.shields.io/badge/node-%E2%89%A5%2022-339933)

CLI que transforma Markdown com frontmatter YAML em **PDF pronto para
imprimir** e entregar na mesa de RPG: carta com selo de cera, cartaz de
procurado, recorte de jornal, telegrama, dossiê, cheque, passagem e mais,
em **A5** ou **A6**.

## 1. O que é

Sabe aquele papel que o mestre quer entregar na mesa? O mesa-press desenha
13 templates — cada um com moldura, tipografia e textura próprias — a
partir de um arquivo Markdown. As fontes vêm empacotadas, então funciona
offline, e os acentos do português saem certos.

É o irmão impresso do [rpg-prop-kit](https://github.com/flippelt/rpg-prop-kit).

> ⚠️ **Status:** `v0.2.0`. A API ainda pode mudar. Não está no npm; use a
> partir do clone.

## 2. Começo rápido

Requer **Node.js 22** ou superior.

```bash
git clone https://github.com/flippelt/mesa-press.git
cd mesa-press
npm ci
npm run build
node dist/cli.js render examples/carta-vigia.md --out carta.pdf
```

Para ver todos os templates de uma vez: `npm run render:examples`
(saem em `dist/pdfs/`).

## 3. Templates, campos e prints

Cada peça com foto, o frontmatter, o CLI e o uso como biblioteca estão na
[wiki](https://github.com/flippelt/mesa-press/wiki).

## 4. Família

| Projeto | Papel |
| --- | --- |
| [rpg-prop-kit](https://www.npmjs.com/package/rpg-prop-kit) | as mesmas linguagens visuais, na tela |
| [session-kit](https://github.com/flippelt/session-kit) | YAML de sessão → Markdown destes templates |
| [Campaign Codex](https://github.com/flippelt/campaign-codex) | destino do QR: o códice da campanha |
| [Immersive Terminal](https://github.com/flippelt/Immersive-Terminal-for-RPGs) | outro destino do QR: terminal na tela |

## 5. Licença

Código sob MIT © 2026 Felipe Lippelt, ver [LICENSE](./LICENSE). As fontes
têm licença própria (SIL OFL ou Apache 2.0), com os textos em
[`fonts/`](./fonts).
