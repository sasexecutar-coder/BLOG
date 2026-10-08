# BLOG — Risco Cognitivo

Monorepo do blog **Risco Cognitivo**. O app vive em [`apps/blog`](apps/blog) e usa o design system **Nocturne** como
fonte de verdade (SoT) visual. Inclui o objeto 3D **HOME-BRAIN-001**: um cérebro em camadas (superfície + pontos + linhas)
reutilizado na **Home** e no **Mapa (`/mapas/`)**.

> **Estado:** app React Router com o mapa 3D do cérebro na Home (`/`) e em `/mapas`, verificado localmente no runtime
> do Worker (workerd) e em Chromium headless com WebGL por software. **Ainda não está no ar:** o deploy a partir desta
> sessão foi bloqueado (ver D-007). FPS e celular real não foram medidos.

## Stack

| Camada | Tecnologia | Situação |
| --- | --- | --- |
| Monorepo | workspaces (`apps/*`), instalação com **bun** (`bun.lock` é o lockfile único; o Workers Builds do painel usa bun) | Implementado |
| **Design system (SoT)** | **Nocturne** — `apps/blog/design-system/nocturne/styles.css` (tokens + componentes), Inter, ícones Phosphor (`@phosphor-icons/react`) | Importado (export parcial, ver D-004) |
| App | React 19.3 + React Router 8.4 (SSR) + Vite 8.3, TypeScript 7.0 | Implementado |
| 3D | Three.js 0.186 + React Three Fiber 9.8 + drei 10.7; GLB real, `MeshSurfaceSampler`, shaders próprios; empacotado (sem CDN); carregado só após a hidratação | Implementado |
| Hospedagem | Cloudflare Workers via `@cloudflare/vite-plugin` + Wrangler 4.148; Worker `blog` | Publicado |
| Testes | `node --test` (geometria) + verificação de presets × CSS + Playwright ad hoc (375 / 393 / 768 / 1440) | Parcial: a suíte Playwright ainda não está versionada |
| Pipeline de assets | Node ≥ 20, sem dependências | Implementado e verificado |
| Fontes anatômicas | OpenNeuro **ds006128** `sub-01`, snapshot 1.0.11, **CC0-1.0** (+ Python ≥ 3.8 para baixar) | Hashes conferidos |

## Estrutura

```
BLOG/
├── README.md
├── package.json                     workspaces + atalhos de assets
├── wrangler.jsonc                   deploy do Worker `blog` a partir da RAIZ (o painel roda `wrangler deploy` aqui)
├── bun.lock
├── apps/
│   └── blog/                        ← o app
│       ├── package.json
│       ├── design-system/
│       │   ├── nocturne/            SoT: styles.css, readme.md (regras), _ds_manifest.json, lint de aderência
│       │   └── references/          referência visual (globo Cloudflare)
│       ├── app/                     rotas (`/`, `/mapas`), root, entry.server
│       │   └── features/brain/      BrainNetworkMap, BrainCanvas (R3F), Hotspots, InfoPanel, Controls, brainTheme/brainGeometry/brainNetworks.data, brain-map.css
│       ├── app/brain/               cena Three.js dos protótipos (brain-scene.js, brain-hollow.js; âncoras vêm daqui)
│       ├── workers/app.ts           entrada do Worker
│       ├── tests/                   testes de geometria (Node)
│       ├── scripts/check-presets.mjs  presets Nocturne × styles.css
│       ├── public/models/home-brain/  assets de runtime (GLB, partículas, config, pôster)
│       ├── pipeline/                gerador determinístico + fontes FreeSurfer + baixador
│       └── prototypes/              protótipos do Claude Design (Landing, Mapa da Execução, Brain View)
├── docs/
│   ├── DECISIONS.md                 decisões e divergências
│   ├── adr/                         ADR-001 (malha anatômica) e ADR-002 (cérebro em pontos, duas rodadas)
│   ├── prompts/claude-design/       prompts, briefing de auditoria e referências — guardados, NÃO executados
│   ├── brief/                       briefs e comandos recebidos (BRIEF, ACEITE, SURFACE, ...)
│   ├── provenance/                  avisos de terceiros, manifestos, build-report, procedência
│   ├── evidence/                    capturas de verificação feitas neste repositório
│   └── archive/design-superseded/   tokens anteriores (laranja, índigo) — NÃO ativos
└── reference/                       código legado e starter do Claude Design — não são dependências
```

## Design system — Nocturne é a fonte de verdade

Interface escura, compacta, Inter em peso 500, acento `#9184d9` usado como linha e brilho (nunca como preenchimento
amplo). Regras completas em [`apps/blog/design-system/nocturne/readme.md`](apps/blog/design-system/nocturne/readme.md).
Resumo do que o app deve cumprir:

- Um único stylesheet (`styles.css`); toda cor, fonte, espaço, raio e sombra vem de `var(--color-*|--font-*|--space-*|--radius-*|--shadow-*)`.
  **Sem hex, nome de fonte ou px que um token já cubra** (a regra está em `_adherence.oxlintrc.json`).
- Botões em contorno; estados de hover/pressed vindos da rampa do acento; foco com `:focus-visible` de 2 px; sem puro preto/branco.
- Ícones Phosphor (o código legado usava `lucide-react`; não migrar para o app).
- Fotografias passam por `.lighten`.

Os tokens anteriores (laranja do pacote Brain e índigo do primeiro Archive) estão arquivados em
`docs/archive/design-superseded/` e **não** devem ser usados.

## Assets do cérebro (`apps/blog/public/models/home-brain/`)

| Arquivo | Conteúdo | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `brain-surface.glb` | 4 malhas `TRIANGLES`: `cortex-left` 132.887 · `cortex-right` 132.217 · `cerebellum` 66.736 · `brain-stem` 18.396 (**350.236** triângulos); atributos `POSITION, NORMAL, COLOR_0, _SULC` | 9.471.892 | `ce97da58…2860c93` |
| `brain-particles.bin` | 42.000 pontos, `int16` LE `x,y,z`; `valor = int16 / 32767 · 2` (unidades de cena) | 252.000 | `c6822ba5…54bdc9` |
| `brain-particles-attr.bin` | 2 × `uint8` por ponto: profundidade sulcal (0–255) e estrutura (0 córtex · 1 cerebelo · 2 tronco) | 84.000 | `6a64659f…ec331` |
| `brain-visual-config.json` | Configuração visual v1.1.0 — **cores índigo desatualizadas** (ver D-001) | 1.216 | — |
| `brain-poster.png` | Pôster/fallback sem WebGL | 1.379.311 | `9ec768c1…545f3ed` |

Transformação: FreeSurfer surface RAS (mm) → eixos de cena `x = anterior, y = superior, z = direita` → centrado →
escala uniforme (1 unidade = 45,58 mm; maior extensão = 3,8). Detalhes em `docs/provenance/`. Os marcadores são
conceituais e vivem em HTML, fora do GLB; nenhuma função executiva é atribuída a uma região.

## Comandos

```bash
bun install                        # lockfile único: bun.lock (é o que o Workers Builds usa)
npm run dev -w apps/blog           # desenvolvimento (Vite + workerd)
npm run check -w apps/blog         # presets × CSS, typecheck, testes de geometria e build
npm run preview -w apps/blog       # serve o build no runtime do Worker (http://localhost:4173 por padrão)
npx wrangler deploy                # na RAIZ: builda apps/blog e publica o Worker `blog` (wrangler.jsonc da raiz)
npm run assets:check               # regenera os assets do cérebro e confere os hashes
```

Parâmetros de URL úteis: `?debug=1` (números), `?controls=1` (abre "Ajustar visual"), `?preset=cloudflare-claro`,
`?angle=lateral|posterior|frontal|<graus>&freeze=1` (ângulo fixo para capturas), `?nowebgl=1` (força o modo sem WebGL).
A configuração visual vai para `?cfg=` e pode ser compartilhada; nada é gravado no navegador.

Os protótipos usam **symlinks** (`_ds/…`, `brain/assets`, `brain/brain-scene.js`) para o design system, os assets e a
cena reais. Em Windows, ative symlinks do Git.

## Verificação feita (e o que falta)

App (`apps/blog/tests/e2e/suite.cjs`, 35/35 em 2026-10-08, Chromium headless com WebGL por software; capturas em
[`docs/evidence/app/`](docs/evidence/app/)):

| Item | Resultado |
| --- | --- |
| Largura do cérebro na vista lateral (375 e 393 px) | 77,9 % da tela (meta ≥ 75 %) |
| Overflow horizontal e erros de console (375 / 393 / 768 / 1440) | nenhum |
| Marcadores visíveis a cada 30° no giro de 360° | 2 em todos os 12 ângulos (meta ≥ 2) — no limite: "visível" = opacidade ≥ 0,3, inclui marcador na borda da silhueta |
| Textos dos 4 callouts | exatos |
| Interseção marcador × texto | 0 (o callout fica fora do canvas) |
| Selecionar função | gira até o marcador ficar de frente |
| Painel "Ajustar visual" | hex e números mudam a cena; contraste WCAG ao vivo; exportar/importar JSON; URL compartilhável |
| Sem WebGL / movimento reduzido | pôster + marcadores em fila / sem giro automático |
| Contraste do marcador | 5,84:1 (Nocturne + laranja), 5,45:1 (Nocturne puro), 3,02:1 (claro) |

Não verificado: **FPS e celular real** (o render por software roda a ~1 quadro/s e não mede desempenho), o comportamento
do toque com o dedo, e o app publicado. Cada quadro desenha a malha (350.236 triângulos) em até 4 passes; em aparelhos
fracos isso pode pesar e precisa ser medido.

Assets e protótipos (G1 do ACEITE): fontes, GLB e pipeline continuam verificados (hashes conferidos, `assets:check`).

## Regras do projeto

- Integrar **somente** a seleção ativa deste repositório; os patches legados não são aplicados.
- O GLB entrega geometria; shaders, luz, pontos, linhas, controles e painel são código (`apps/blog/app/brain/`).
- Carregar a cena após a hidratação e sob demanda; `prefers-reduced-motion` começa parado; pausar fora da área visível;
  liberar GPU ao desmontar; manter pôster + conteúdo HTML sem WebGL.
- Marcadores e painéis em HTML acessível (alvo ≥ 44 px, foco visível, teclado).
- Desenvolvimento no branch designado; deploy só com autorização explícita de publicação.

## Próximos passos

1. Publicar (D-007): rodar o build do painel do Cloudflare depois do merge, ou liberar o deploy por aqui.
2. Medir em celular real: FPS, toque/rolagem, legibilidade dos marcadores e do preset claro.
3. Resolver D-004 (export parcial do Nocturne), D-005 (tema claro no DS) e D-003 (fsaverage × `sub-01`).
4. Corrigir `depth01()` no gerador (a profundidade do `.bin` satura); o app já lê `_SULC` direto do GLB.
