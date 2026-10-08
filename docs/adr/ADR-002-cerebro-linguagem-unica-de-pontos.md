# ADR-002 — Cérebro em linguagem única de pontos (estilo globo) e prototipação em duas rodadas

- **Status:** Proposta — registrada, **não executada**. Conflita com o ADR-001 e com o design system (ver "Conflitos").
- **Data:** 2026-10-08
- **Escopo:** HOME-BRAIN-001 (seção "Entenda sua execução" da home e `/mapas/`)
- **Relacionada a:** [ADR-001](ADR-001-malha-anatomica-do-cerebro.md), `docs/DECISIONS.md` (D-001, D-005, D-006),
  `docs/prompts/claude-design/`

## Contexto

Uma auditoria (`docs/prompts/claude-design/02_BRIEFING-auditoria.md`) comparou o globo "Region: Earth" de cloudflare.com com o
cérebro atual do site, a partir de 6 capturas de iPhone (393×852 pt). Diagnóstico do briefing: o globo é **uma única
linguagem visual** (matriz regular de pontos de uma cor, com aro e grade, marcadores e callouts leves por cima); o
cérebro atual mistura **duas** (malha cinza sólida + pontos índigo aleatórios), é pequeno no palco e tem callouts que o
cobrem.

Medidas do briefing (medidas nos pixels das capturas pelo autor do briefing; **não foram reverificadas aqui**):

| Atributo | Globo | Cérebro atual | Meta |
| --- | --- | --- | --- |
| Largura do objeto | 79% da tela | 56% | 75–80% |
| Cobertura do callout sobre o objeto | ≈15% | ≈51% | ≤ 20% |
| Contraste do contorno do marcador | — | 2,3:1 (falha WCAG 1.4.11) | ≥ 3:1 |
| Interseção marcador × texto | — | 2 de 2 callouts cortados | 0 |
| Marcadores visíveis em qualquer ângulo | — | ausentes em repouso | ≥ 2 |

Defeitos de código do briefing que **foram conferidos neste repositório**: `uCam`/`uRef` fixos em 6,6 em
`brain-hollow.js` (CD-01); face de trás dos pontos com alfa 0,14 (CD-02); contornos de 13 latitudes e 9 meridianos já
existentes; `pixelRatio` limitado a 2 em `three-d-stage.js` (CD-05); enquadramento por `Box3.getBoundingSphere`, coerente
com a hipótese da causa de BR-05.

## Decisão

1. **Direção visual:** uma única linguagem de pontos com grade fina de contornos e aro, **sem malha visível**. A malha
   permanece apenas como oclusor invisível (`colorWrite=false`, `depthWrite=true`, desenhada antes dos pontos);
   alternativa `xray` com face de trás a alfa ≤ 0,08. Padrão: `occlude`.
2. **Prototipar no Claude Design em duas rodadas, com arquivos anexados** (um prompt único com cena, marcadores e callouts
   "tende a sair raso"):
   - **Rodada 1 — só a cena:** câmera sem constantes (distância por quadro no shader), enquadramento pela esfera justa
     dos pontos, pontos por amostragem blue-noise (se > 300 ms no navegador, manter os atuais), cor por tokens CSS em
     dois temas (Claro e Noite), aro, rotação só em y com `touch-action: pan-y`, `pixelRatio` até 3, parâmetros de teste
     (`?angle=…&freeze=1`, `?back=…`, `?theme=…`) e painel `?debug=1`.
   - **Rodada 2 — marcadores e callouts, só depois de aprovar a cena:** 4 marcadores (`<button aria-pressed>`, 36 pt,
     alvo 44 pt) ancorados com `anchor(dir)`, callout único de borda tracejada com 4 colchetes no quadrante livre, textos
     exatos fornecidos, `?callout=0..3` e métricas extras no `?debug=1`.
3. **Aceitar por números, não "a olho":** exigir os valores do painel `?debug=1` em cada resposta e compará-los com as
   metas da tabela acima e com o handoff.
4. Os prompts completos ficam **versionados e sem execução** em `docs/prompts/claude-design/`.

## Alternativas

| Alternativa | Por que não |
| --- | --- |
| Prompt único com cena + marcadores + callouts | Resultado "raso" (avaliação do autor). Existe uma variante de prompt único em duas fases (`01_PROMPT.md`, com portão "aprovado") para o caso de os extras ficarem longos demais. |
| Manter malha sólida + pontos (ADR-001) | Mantém a linguagem mista que o briefing aponta como defeito P0 (BR-01). |

## Avisos do autor (preservados)

- O starter 3D (`three-d-stage.js`) foi feito para exibir e exportar objetos; o prompt pede para desligar toolbar,
  sombra de chão e zoom, que ele cria por padrão.
- Os valores de movimento (55 s por volta, 240 ms de entrada, 160 ms de saída, 6 s para a troca automática) são
  **propostas**, não medidas da Cloudflare. Uma gravação de tela do globo validaria isso; não foi recebida.
- Não se conhece o limite de upload do Claude Design. Se rejeitar, usar `extras/` e anexar menos arquivos; se não
  aceitar upload, colar o código de `brain-hollow.js` no texto.

## Conflitos com decisões e artefatos existentes (não resolvidos silenciosamente)

| # | Este ADR / prompts | Existente | Efeito |
| --- | --- | --- | --- |
| 1 | Sem malha visível; reconhecível **só pelos pontos** | ADR-001: "superfície sólida como base… partículas como camada complementar"; `BRIEF.md`: o cérebro "deve conservar forma e leitura de volume **mesmo quando os pontos forem ocultados**" | Inversão da direção visual. Se este ADR for aceito, supera o trecho de direção visual do ADR-001; a escolha da fonte da malha (fsaverage × `sub-01`) segue pendente lá. |
| 2 | `--brain-accent #6E72E8`, fundo Noite `#151414`, fundo Claro `#FFFFFF` | Nocturne (SoT, D-001): acento `#9184d9`, fundo `#161826`; a regra do DS proíbe puro branco/preto. `#6E72E8` é o índigo do 1º Archive, já arquivado | Enviar o prompt como está faria o Claude Design reintroduzir a paleta arquivada. |
| 3 | Tokens `--brain-*` e `--text-primary` / `--text-secondary` | O Nocturne define `--color-accent`, `--color-bg`, `--color-text` etc.; **não** define `--brain-dot-ambient`, `--brain-dot-peak`, `--brain-rim` nem `--text-secondary` | Os tokens do cérebro precisariam existir no design system (fonte única) ou ser mapeados; decisão em aberto (D-006). |
| 4 | Temas Claro e Noite | Nocturne é escuro; o claro existe só inline nos protótipos (D-005) | Depende de decidir se o tema claro entra no DS. |
| 5 | Tipografia "DM Sans (títulos), Inter (interface)" no briefing | Nocturne: só Inter | Divergência a resolver. |
| 6 | Textos exatos dos callouts (ex.: "Define metas, organiza passos e prioriza ações.") e rótulo "Controle inibitório" | Protótipo `Brain View.html` usa outros textos ("Manter e manipular informação ativa.") e o rótulo "Inibição" | Duas versões de copy; definir qual é a oficial. O briefing lembra que conteúdo sem fonte validada não é fato. |
| 7 | Amostragem blue-noise e contornos/âncoras assados no build (CD-03) | `build-brain-assets.js` usa `mulberry32` com semente 41005; `assets:check` compara hashes fixos | Qualquer mudança nos pontos altera `brain-particles.bin` e `build-report.json`; o `assets:check` e a procedência teriam de ser atualizados juntos. |
| 8 | Âncoras e contornos dependem da malha | ADR-001 ainda não decidiu fsaverage × `sub-01` | Trocar a malha depois invalida o protótipo. Recomenda-se fechar essa pendência **antes** da rodada 1. |

## Pendências antes de enviar ao Claude Design

1. Decidir D-006 (tokens do cérebro × Nocturne) e, se for o caso, adaptar os prompts. **Os prompts guardados não foram
   editados.**
2. Fechar a pendência 1 do ADR-001 (malha) ou aceitar refazer o protótipo se mudar.
3. Anexar `styles.css` do Nocturne no lugar do `tokens.css` (que não existe mais como arquivo ativo).
4. Opcional: gravação de tela do globo (valida tempos) e `brain-stage.tsx`.

## Não verificado

Como o globo da Cloudflare é construído (hipótese do briefing); movimentos e tempos (só há capturas estáticas); versão
desktop; `brain-stage.tsx`. Nenhuma rodada foi executada e nenhum resultado do Claude Design existe ainda.
