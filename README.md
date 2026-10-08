# BLOG — Risco Cognitivo

Monorepo do blog **Risco Cognitivo**. O app vive em [`apps/blog`](apps/blog) e usa o design system **Nocturne** como
fonte de verdade (SoT) visual. Inclui o objeto 3D **HOME-BRAIN-001**: um cérebro em camadas (superfície + pontos + linhas)
reutilizado na **Home** e no **Mapa (`/mapas/`)**.

> **Estado:** setup. Design system, assets 3D, cena, pipeline e protótipos estão organizados e verificados. O app
> React ainda **não** foi criado (ver [Próximos passos](#próximos-passos)). Nada foi publicado; produção exige
> autorização específica.

## Stack

| Camada | Tecnologia | Situação |
| --- | --- | --- |
| Monorepo | npm workspaces (`apps/*`) | Implementado, sem dependências ainda |
| **Design system (SoT)** | **Nocturne** — `apps/blog/design-system/nocturne/styles.css` (tokens + componentes), Inter, ícones Phosphor | **Importado** (export parcial, ver D-004) |
| UI | React + React Router (SSR), cena 3D carregada após a hidratação | Definida nos documentos; app não criado |
| Linguagem | TypeScript (app) · JavaScript ESM (cena e pipeline herdados) | Definida |
| 3D | Three.js **r184** (`0.184.0`) | Em uso nos protótipos e em `app/brain/*.js` |
| Hospedagem | Cloudflare Workers (Wrangler) | Definida; sem deploy |
| Testes | Playwright (375 / 768 / 1440) + typecheck + build | Planejada |
| Pipeline de assets | Node ≥ 20, sem dependências | **Implementado e verificado** |
| Fontes anatômicas | OpenNeuro **ds006128** `sub-01`, snapshot 1.0.11, **CC0-1.0** (+ Python ≥ 3.8 para baixar) | Hashes conferidos |

Versões de React, React Router, TypeScript e Wrangler **não estão fixadas** em nenhum documento recebido; serão fixadas
no scaffold do app, não presumidas aqui.

## Estrutura

```
BLOG/
├── README.md
├── package.json                     workspaces + atalhos de assets
├── apps/
│   └── blog/                        ← o app
│       ├── package.json
│       ├── design-system/
│       │   ├── nocturne/            SoT: styles.css, readme.md (regras), _ds_manifest.json, lint de aderência
│       │   └── references/          referência visual (globo Cloudflare)
│       ├── app/brain/               cena Three.js framework-free (brain-scene.js, brain-hollow.js)
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
npm run assets:check     # regenera a partir de apps/blog/pipeline/source e compara com docs/provenance/build-report.json
npm run assets:build     # idem, escrevendo em apps/blog/public/models/home-brain
npm run prototypes -w apps/blog   # serve os protótipos em http://localhost:4173 (Brain View: /brain/Brain%20View.html)
python3 apps/blog/pipeline/fetch_openneuro.py   # só se pipeline/source estiver vazio (exige rede)
```

Os protótipos usam **symlinks** (`_ds/…`, `brain/assets`, `brain/brain-scene.js`) para o design system, os assets e a
cena reais, evitando cópias do SoT. Em Windows, ative symlinks do Git.

## Verificação feita (e o que falta)

| Gate (`docs/brief/ACEITE.md`) | Item | Estado |
| --- | --- | --- |
| G1 | 5 fontes com origem, licença e hash | ✅ conferidos |
| G1 | GLB com triângulos, reaberto por parser independente | ✅ 4 primitivas `TRIANGLES`, 350.236 triângulos |
| G1 | Pipeline reproduzível | ✅ `assets:check` reproduz os 3 hashes |
| G2/G3 | Render do protótipo Brain View com Nocturne | ✅ renderizou (Chromium headless, WebGL por software/SwiftShader) em 1440 e 375 px — [`docs/evidence/`](docs/evidence/) |
| G3 | **Defeito mobile (375 px):** o card "Memória de trabalho" sobrepõe o próprio marcador e corta o texto | ❌ a corrigir no app |
| G3 | FPS, dispositivo real, 768 px, teclado, movimento reduzido, rolagem mobile | ⏳ não medidos |
| G2 | Comparação com a referência, lateral e 3/4, em fundo branco | ⏳ o fundo agora é Nocturne (escuro): critério do BRIEF a revisar (D-001) |
| G4 | Handoff React, aprovação visual explícita | ⏳ |

Não há medição de FPS neste README; o render foi por software e não representa desempenho em dispositivo.

## Regras do projeto

- Integrar **somente** a seleção ativa deste repositório; os patches legados não são aplicados.
- O GLB entrega geometria; shaders, luz, pontos, linhas, controles e painel são código (`apps/blog/app/brain/`).
- Carregar a cena após a hidratação e sob demanda; `prefers-reduced-motion` começa parado; pausar fora da área visível;
  liberar GPU ao desmontar; manter pôster + conteúdo HTML sem WebGL.
- Marcadores e painéis em HTML acessível (alvo ≥ 44 px, foco visível, teclado).
- Desenvolvimento no branch designado; deploy só com autorização explícita de publicação.

## Próximos passos

1. Resolver as pendências de [`docs/DECISIONS.md`](docs/DECISIONS.md) (D-004 export parcial do DS, D-005 tema claro, D-006
   tokens do cérebro) e do [ADR-001](docs/adr/ADR-001-malha-anatomica-do-cerebro.md) (fsaverage × `sub-01`); decidir o
   [ADR-002](docs/adr/ADR-002-cerebro-linguagem-unica-de-pontos.md) antes de enviar os prompts.
2. Scaffold do app React Router + TypeScript em `apps/blog`, fixando versões e ligando `styles.css` do Nocturne.
3. Componente único do cérebro (props: modo, conceito, movimento, seleção) para Home e `/mapas/`, a partir de `Brain View.html`.
4. Corrigir o card sobreposto no mobile; testes Playwright em 375 / 768 / 1440; PR com instrução de reversão.
