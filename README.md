# BLOG — Risco Cognitivo · Cérebro editorial (HOME-BRAIN-001)

Repositório de trabalho do objeto 3D **HOME-BRAIN-001**: um cérebro em camadas (superfície + pontos + linhas) que será
reutilizado na **Home** e no **Mapa (`/mapas/`)** do site Risco Cognitivo.

> **Estado:** setup inicial. Assets, pipeline e cena estão organizados e verificados por hash. O app React ainda **não**
> foi criado (ver [Próximos passos](#próximos-passos)). Nada foi publicado; produção exige autorização específica.

## Stack

| Camada | Tecnologia | Situação |
| --- | --- | --- |
| Linguagem | TypeScript (app) · JavaScript ESM (cena e pipeline herdados) | Definida nos documentos |
| UI | React + React Router, SSR, hidratação antes de carregar a cena | Definida; app ainda não criado |
| 3D | Three.js **r184** (`0.184.0`), `GLTFExporter`/`OrbitControls` só no estúdio de revisão | Definida (`src/brain/*.js` usa r184) |
| Estilo | CSS puro com tokens canônicos (`design/tokens/tokens.css`) | Definida; paleta em decisão (D-001) |
| Hospedagem | Cloudflare Workers (deploy com Wrangler) | Definida; sem deploy neste repositório |
| Testes | Playwright (viewports 375 / 768 / 1440) + typecheck + build | Planejada |
| Pipeline de assets | Node ≥ 20 (`DecompressionStream`, `crypto.subtle`) — sem dependências | **Implementada e verificada** |
| Obtenção das fontes | Python ≥ 3.8 (`fetch_openneuro.py`, verifica SHA-256) | Implementada (herdada) |
| Dados anatômicos | OpenNeuro **ds006128** `sub-01`, snapshot 1.0.11, licença **CC0-1.0** | Registrada, hashes verificados |

Versões de React, React Router, TypeScript e Wrangler **não estão fixadas** em nenhum documento recebido; serão fixadas
no scaffold do app, e não presumidas aqui.

## Estrutura

```
BLOG/
├── README.md
├── package.json                  scripts do pipeline (sem dependências)
├── docs/
│   ├── DECISIONS.md              decisões em aberto e conflitos entre as entradas
│   ├── adr/                      ADR-001: malha anatômica e direção visual
│   ├── brief/                    BRIEF, ACEITE, SURFACE, CONFLITOS, comandos do Claude Design e de integração
│   └── provenance/               avisos de terceiros, manifesto OpenNeuro, build-report.json
├── design/
│   ├── tokens/
│   │   ├── tokens.css            tokens ATIVOS (pacote CLAUDE-DESIGN-BRAIN-001, marca laranja)
│   │   └── tokens.indigo-archive.css   variante índigo do Archive.zip (não ativa — ver D-001)
│   └── evidence/                 referência visual (globo Cloudflare)
├── pipeline/
│   ├── build-brain-assets.js     gerador determinístico (seed 41005): FreeSurfer → GLB + partículas
│   ├── build.mjs                 executor Node do gerador (+ verificação de hashes)
│   ├── fetch_openneuro.py        baixa as 5 fontes com SHA-256 (use se `source/` estiver vazio)
│   ├── manifest.json             URLs e hashes das fontes
│   └── source/                   5 arquivos FreeSurfer originais (~12 MB, CC0)
├── public/models/home-brain/     assets de runtime (caminho único; centralizar no app)
├── src/brain/
│   ├── brain-scene.js            cena Three.js framework-free (parseGlb, inspectGlb, loadBrainAssets, createBrain)
│   └── brain-hollow.js           variante "oca" (contornos + pontos), mesma anatomia
└── reference/                    somente referência — NÃO são dependências
    ├── legacy-react/             BrainHero.tsx, renderer, types (blog anterior; deps `@/data/home`, `@/lib/analytics`)
    └── design-starter/           three-d-stage.js (shell do Claude Design com exportador OBJ/GLB)
```

## Assets de runtime (`public/models/home-brain/`)

| Arquivo | Conteúdo | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `brain-surface.glb` | 4 malhas `TRIANGLES`: `cortex-left` 132.887 · `cortex-right` 132.217 · `cerebellum` 66.736 · `brain-stem` 18.396 (343.236 triângulos); atributos `POSITION, NORMAL, COLOR_0, _SULC` | 9.471.892 | `ce97da58…2860c93` |
| `brain-particles.bin` | 42.000 pontos, `int16` little-endian `x,y,z`; `valor = int16 / 32767 · 2` (unidades de cena) | 252.000 | `c6822ba5…54bdc9` |
| `brain-particles-attr.bin` | 2 × `uint8` por ponto: profundidade sulcal (0–255) e estrutura (0 córtex · 1 cerebelo · 2 tronco) | 84.000 | `6a64659f…ec331` |
| `brain-visual-config.json` | Configuração visual v1.1.0 (unidades declaradas no arquivo) | 1.216 | — |
| `brain-poster.png` | Pôster/fallback sem WebGL | 1.379.311 | `9ec768c1…545f3ed` |

Transformação: FreeSurfer surface RAS (mm) → eixos de cena `x = anterior, y = superior, z = direita` → centrado →
escala uniforme (1 unidade = 45,58 mm; maior extensão = 3,8). Detalhes em `docs/provenance/build-report.json`.

Os pontos não localizam funções executivas em regiões: os marcadores são conceituais e vivem em HTML, fora do GLB.

## Comandos

```bash
# Regenera os assets a partir de pipeline/source e confere com docs/provenance/build-report.json
npm run assets:check          # saída em pipeline/out (ignorado pelo git)

# Regenera e escreve direto em public/models/home-brain
npm run assets:build

# Só se pipeline/source estiver vazio (precisa de rede para s3.amazonaws.com/openneuro.org)
python3 pipeline/fetch_openneuro.py
```

`assets:check` foi executado neste setup: GLB, partículas e atributos reproduzem **exatamente** os hashes publicados.

## Estado frente ao ACEITE (`docs/brief/ACEITE.md`)

| Gate | Item | Estado |
| --- | --- | --- |
| G1 | Fontes com origem, licença e hash | ✅ 5/5 hashes conferidos |
| G1 | Superfície real com triângulos | ✅ GLB reaberto por parser independente: 4 primitivas `TRIANGLES` |
| G1 | Pipeline reproduzível | ✅ `assets:check` |
| G1 | Modo superfície legível sem pontos; transformação consistente | ⏳ exige revisão visual |
| G2 | Comparação visual com a referência, controles, JSON da configuração | ⏳ não renderizado neste setup |
| G3 | Interação, 375/768/1440, FPS, WebGL ausente | ⏳ depende do app |
| G4 | GLB, partículas documentadas, config JSON, pôster, procedência | ✅ presentes · ⏳ handoff React e aprovação visual |

Nenhuma medição de FPS ou captura de tela foi feita; nada disso deve ser inferido deste README.

## Regras do projeto

- Integrar **somente** a seleção ativa deste repositório. Os patches legados (`HOME_BRAIN_FULLSTACK_v1.0.0`,
  `MOBILE_FIX_v1.0.1`) não são aplicados.
- O GLB entrega geometria; shaders, luz, pontos, linhas, controles e painel são código (`src/brain/`).
- Carregar a cena após a hidratação e sob demanda; respeitar `prefers-reduced-motion` (começa parada), pausar fora da
  área visível, liberar recursos da GPU ao desmontar e manter pôster + conteúdo HTML sem WebGL.
- Marcadores e painéis são HTML acessível (área de toque ≥ 44 px, foco visível, teclado).
- Desenvolvimento no branch designado; deploy só com autorização explícita de publicação.

## Próximos passos

1. Resolver as decisões abertas em [`docs/DECISIONS.md`](docs/DECISIONS.md) (paleta, repositório do app e fonte da malha, [ADR-001](docs/adr/ADR-001-malha-anatomica-do-cerebro.md)).
2. Scaffold do app React Router + TypeScript para Cloudflare Workers, fixando versões.
3. Componente único do cérebro (props: modo, conceito selecionado, movimento, evento de seleção) usado em Home e `/mapas/`.
4. Revisão visual (G2) com painel de controles e exportação da configuração.
5. Testes Playwright em 375 / 768 / 1440 e registro de evidências (G3), PR com instrução de reversão (G4).
