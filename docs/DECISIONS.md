# Decisões em aberto e conflitos entre as entradas

Origem: `CLAUDE-DESIGN-BRAIN-001.zip` (pacote de entrada v2.0.0, `PREPARED`) e `Archive.zip` (saída posterior do
Claude Design, gerada em 2026-10-06 com a malha). Itens abertos precisam de decisão do responsável antes do app.

## Resolvidas por instrução do usuário (2026-10-07)

### D-001 — Paleta → **Nocturne é a fonte de verdade**

Havia três identidades: laranja (pacote Brain, `#F56A1C`), índigo (1º Archive, `#6E72F0`) e **Nocturne** (2º Archive,
escuro, acento `#9184d9`). Por instrução ("design system SoT"), vale **Nocturne**, em `apps/blog/design-system/nocturne/`.
Os dois conjuntos anteriores foram arquivados em `docs/archive/design-superseded/`.

Consequências a tratar (não resolvidas silenciosamente):
- O BRIEF/ACEITE do cérebro exigem **fundo branco** e pontos laranja. Com Nocturne, o fundo é escuro e a cena já é
  recolorida em tempo de execução por `prototypes/brain/Brain View.html` (blocos por tema). Os critérios visuais G2 do
  ACEITE devem ser reescritos para Nocturne; o resto do BRIEF (camadas, controles, acessibilidade) segue valendo.
- `public/models/home-brain/brain-visual-config.json` ainda traz as cores índigo do 1º Archive: está desatualizado e
  **não** foi alterado, para não inventar valores.

### D-002 — Local do app → **`apps/blog` na raiz deste repositório**

A instrução "apps blog na raiz" define o app em `apps/blog` (monorepo com npm workspaces). O destino
`hubexecutar-lgtm/react-router-starter-template` citado em `COMANDO-INTEGRACAO-REACT.md` fica como origem do template,
não como destino. O app React ainda não foi criado.

## Abertas

### D-004 — O export do Nocturne é parcial

O `readme.md` do DS cita `theme.json`, `thumbnail.html`, `foundations/`, `components/`, `templates/` e
`assets/photo.jpg`; o ZIP traz só `styles.css`, `readme.md`, `_ds_manifest.json`, `_adherence.oxlintrc.json` e
`_ds_bundle.js`. O readme manda manter `theme.json` em sincronia com o CSS: ele não existe aqui. Além disso `styles.css`
carrega Inter por `@import` do Google Fonts (dependência externa de rede; avaliar hospedar a fonte).

### D-005 — O tema claro existe só dentro dos protótipos

`Landing.dc.html` e `Brain View.html` redefinem os tokens para `[data-rc-theme="light"]` com **hex literais**, fora do DS.
Isso contraria a regra de SoT. Decidir se o tema claro entra em `design-system/nocturne/` (fonte única) ou se o app é
somente escuro.

### D-003 — Fonte da malha: fsaverage × sub-01 individual

Registrada em [`adr/ADR-001-malha-anatomica-do-cerebro.md`](adr/ADR-001-malha-anatomica-do-cerebro.md). Recomendação:
fsaverage (referência) como ponto de partida; o repositório já contém o GLB do `sub-01`. Pendente de confirmação.

### D-006 — Prompts do Claude Design × Nocturne (SoT)

Registrada no [ADR-002](adr/ADR-002-cerebro-linguagem-unica-de-pontos.md). Os prompts guardados em
`docs/prompts/claude-design/` pedem `--brain-accent #6E72E8`, fundos `#151414`/`#FFFFFF` e tokens `--brain-*` /
`--text-primary|secondary`, que não existem no Nocturne e reintroduzem a paleta arquivada. Decidir: criar os tokens do
cérebro no design system (fonte única) ou mapeá-los para os tokens `--color-*`. Prompts originais **não editados**.

**Proposta (2026-10-08):** versão adaptada em `prompts/claude-design/nocturne/`, com `--brain-*` como aliases de
`--color-*` e contrastes calculados em `MAPEAMENTO.md`. Aguarda aceite.

## Divergências encontradas e tratadas

| Achado | Tratamento |
| --- | --- |
| `package-manifest.json` lista `02-assets/brain-points.bin`, mas o arquivo **não está** no ZIP | Substituído pelo `brain-particles.bin` do Archive (mesmo formato, 42.000 pontos, hash `c6822ba5…`, reproduzível pelo pipeline). `brain-point-cloud.ply` (derivado do `.bin` ausente) não foi importado. |
| Hash do `brain-poster.webp` no manifesto (`39973b39…`) ≠ arquivo no ZIP (`a9826f6f…`) | O `.webp` é o pôster legado (igual ao `brain-poster-legacy.webp` do Archive). Usado o `brain-poster.png` do Archive; o legado não foi importado. |
| Pacote diz "malha triangular ausente" e "download bloqueado" | Superado: o Archive traz os 5 insumos (hashes conferidos) e o GLB com 4 malhas triangulares. |
| `build-brain-assets.js` depende de globais do harness (`readFileBinary`, `saveFile`, `log`) | Criado `pipeline/build.mjs`; saída reproduz os hashes do `build-report.json`. |
| `reference/legacy-react/*` importa `@/data/home`, `@/lib/analytics/track`, `lucide-react` | Mantido só como referência de rotação, câmera e eventos. Não é compilável neste repositório. |
| Capturas de UI (`claude-codebase.png`, `claude-skills.png`) e `INPUT_INVENTORY.csv` | Não importados; permanecem no ZIP original. Mantida só a referência do globo. |
| A skill de design customizada citada no pacote | Não consta em nenhum dos dois ZIPs; não foi aplicada nem se afirma que foi. |
| `PROVENIENCIA.md` do 2º Archive lista hashes de partículas (`1da8e10d…`, `ceb2f0e3…`) que **não** correspondem aos arquivos entregues | Os arquivos reais (`c6822ba5…`, `6a64659f…`) coincidem com `build-report.json` e com a regeneração local por `assets:check`. Prevalecem os reais; o documento foi importado como está (`docs/provenance/PROVENIENCIA-brain-view.md`) com errata no topo. |
| Total de triângulos do GLB | **350.236** (132.887 + 132.217 + 66.736 + 18.396), como na PROVENIENCIA. Um valor anterior (343.236) neste repositório estava errado e foi corrigido. |
| Capturas `screenshots/*.jpg` do 2º Archive mostram marcadores e grade **sem o cérebro** | Não servem de evidência visual da malha. Mantidas como estão em `prototypes/screenshots/`; a verificação real está em `docs/evidence/`. |
| `Brain View.html` busca `three@0.184.0` em `unpkg.com` | Dependência de CDN nos protótipos; o app deve empacotar Three.js. |
