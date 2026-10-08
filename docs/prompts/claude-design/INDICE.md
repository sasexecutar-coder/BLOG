# Prompts do Claude Design — índice e estado dos anexos

**Nada aqui foi executado.** Os prompts estão guardados, sem alterações, para envio manual ao Claude Design.

## Arquivos

| Arquivo | O que é | Origem |
| --- | --- | --- |
| `MENSAGEM-ORIGINAL.md` | Texto das duas rodadas + lista de anexos + 3 avisos, como recebido | mensagem do usuário |
| `01_PROMPT.md` | Prompt único em duas fases (a Fase 2 só após responder "aprovado") | pacote `risco-cognitivo-cerebro-3d.zip` |
| `extras/prompt-rodada-1-cena.md` · `extras/prompt-rodada-2-marcadores-callouts.md` | As duas fases separadas, citando as pastas do pacote | idem |
| `02_BRIEFING-auditoria.md` | Diagnóstico com medidas e critérios de aceite (BR-01…, CD-01…) | idem |
| `00_LEIA-ME.md` · `FALTA-ADICIONAR/LEIA-ME.txt` | Como usar o pacote e o que faltava anexar | idem |
| `nocturne/` | **Versão adaptada ao Nocturne** das duas rodadas + `MAPEAMENTO.md` (tokens, contrastes, o que mudou) | adaptação (proposta D-006) |
| `referencias/` | 3 prints do globo, 3 do cérebro atual e a colagem lado a lado | idem |

Decisão associada: [`../../adr/ADR-002-cerebro-linguagem-unica-de-pontos.md`](../../adr/ADR-002-cerebro-linguagem-unica-de-pontos.md).

## Onde está cada anexo pedido (conferido por `cmp` quando há cópia no pacote)

| Anexo pedido | No repositório | Situação |
| --- | --- | --- |
| `brain-hollow.js` | `apps/blog/app/brain/brain-hollow.js` | ✅ idêntico ao do pacote |
| `brain-scene.js` | `apps/blog/app/brain/brain-scene.js` | ✅ presente (idêntico ao do 2º Archive) |
| `build-brain-assets.js` | `apps/blog/pipeline/build-brain-assets.js` | ✅ idêntico ao do pacote |
| `three-d-stage.js` (starter) | `reference/design-starter/three-d-stage.js` | ✅ idêntico ao do pacote |
| `brain-surface.glb`, `brain-particles.bin`, `brain-particles-attr.bin` | `apps/blog/public/models/home-brain/` | ✅ presentes, hashes conferidos |
| `build-report.json` | `docs/provenance/build-report.json` | ✅ presente |
| 3 prints do globo, 3 do cérebro atual, colagem | `docs/prompts/claude-design/referencias/` | ✅ presentes (a colagem chegou como `colagem-globo-vs-cerebro.jpeg`; não confirmei se é a "IMG_3301") |
| `tokens.css` | `apps/blog/design-system/nocturne/styles.css` | ⚠️ **não equivalente**: o prompt exige tokens `--brain-*` e `--text-primary/secondary`, que o Nocturne não define (ver ADR-002) |
| `brain-stage.tsx` (componente de produção, opcional) | — | ❌ não recebido |
| Gravação de tela do globo (~10 s, opcional) | — | ❌ não recebida; os tempos de movimento do prompt continuam sendo propostas |
| Print do `brain-hollow.js` ativo (opcional) | — | ❌ não recebido |
