# Briefing de auditoria: cérebro 3D (Risco Cognitivo) vs. globo (Cloudflare)

Base: 6 capturas de iPhone (1179×2556 px, @3x = 393×852 pt), leitura do HTML das duas páginas e dos 3 arquivos de código do time. Medidas em pt = px ÷ 3.
Legenda: [M] medido nos pixels · [V] visto nas capturas · [D] dado do HTML/código · [H] hipótese a validar.

## Diagnóstico em uma frase
O globo é uma única linguagem visual (matriz regular de pontos de uma cor, com aro e grade, marcadores e callouts leves por cima). O cérebro atual mistura duas (malha cinza sólida + pontos índigo aleatórios), é pequeno no palco e tem callouts que o cobrem.

## Medidas
| Atributo | Globo | Cérebro atual |
|---|---|---|
| Fundo | #151414 [M] | #FFFFFF + grade de pontos [M] |
| Largura do objeto | 311 pt · 79% [M] | 221 pt · 56% [M] |
| Altura do objeto | 314 pt [M] | 171 pt [M] |
| Ocupação da altura do palco | ≈76% [V] | ≈38% [V] |
| Pontos | Rede regular, 1 matiz; ambiente ≈12% de opacidade da marca (≈#301810), pico ≈#F85818 [M] | Aleatórios; malha ≈#D8D8D8 + pontos ≈#8080E0 [M] |
| Fecho da silhueta | Aro fino + grade lat/long [V] | Elipses lavanda quase invisíveis [V] |
| Cobertura callout/objeto | ≈15% [M] | ≈51% [M] |
| Contraste do marcador | Preenchido 5,6:1 [M] | Contorno #A4A4F0 = 2,3:1 (falha WCAG 1.4.11); preenchido #6E72E8 = 4,0:1 [M] |

## Defeitos e critérios de aceite
- **BR-01 P0 · Linguagem mista.** Malha cinza opaca + pontos. Aceite: com a malha oculta, a forma continua reconhecível só pelos pontos.
- **BR-02 P0 · Pontos em ruído branco.** `sample()` do build sorteia posições aleatórias (mulberry32, semente 41005). Aceite: sem aglomerados nem buracos a 100% de zoom (usar blue-noise).
- **BR-03 P0 · Marcador corta o texto do callout.** "Define" vira "efine"; "estratégias" vira "estratégia". Aceite: 0 interseções marcador × texto de 320 a 1440 px.
- **BR-04 P1 · Callout cobre o objeto** (≈51% da área). Aceite: ≤ 20%, no quadrante livre, com haste ao marcador.
- **BR-05 P1 · Escala.** Cérebro com 56% da largura; meta 75–80%. Causa provável [H]: o starter enquadra pela esfera da caixa (meia-diagonal), maior que o meio-comprimento do cérebro. Enquadrar pela esfera justa dos pontos.
- **BR-06 P1 · Silhueta sem fecho.** O brain-hollow.js já resolve com 13 latitudes + 9 meridianos; manter, mais aro fino.
- **BR-07 P1 · Marcadores ausentes em repouso.** Meta: ≥ 2 visíveis em qualquer ângulo.
- **BR-08 P1 · Contraste.** Contorno de marcador a 2,3:1; meta ≥ 3:1. Alinhar o ponto profundo (#5A5FE8 no hollow) ao `--brain-accent` (≈#6E72E8).
- **CD-01 P0 · Câmera fixa no shader.** `uCam`/`uRef` = 6,6 no brain-hollow.js; calcular a distância a cada frame.
- **CD-02 P1 · Sem oclusão.** Face de trás aparece com alfa 0,14. Testar occlude vs. xray (alfa ≤ 0,08).
- **CD-03 P1 · Trabalho pesado no cliente.** GLB inteira + fatiamento na thread principal. Assar contornos, âncoras e máscara no build.
- **CD-04 P1 · Cores em hex, só tema claro.** Usar tokens CSS; temas Claro e Noite.
- **CD-05 P1 · Resolução.** Starter limita pixelRatio a 2; iPhones são @3x.
- **CD-06 P1 · Toque.** OrbitControls pode bloquear a rolagem; usar só rotação em y, `touch-action: pan-y`.
- **BR-11 P2 · Movimento sem pausa** (decisão D-36 do site); rotação ≈ 50 s por volta no starter.

## Regras do site que valem para o protótipo
- Componentes nunca usam hex, só tokens.
- Conteúdo sem fonte validada não é apresentado como fato. Os marcadores não representam regiões clínicas exatas.
- Marcador: círculo de 36 pt, alvo de toque de 44 pt. Callout: borda tracejada + 4 colchetes de canto. Raio 2 no callout.
- Tipografia: DM Sans (títulos), Inter (interface).

## Não verificado
Tecnologia do globo da Cloudflare (hipótese), movimento e timings (só há capturas estáticas), versão desktop, `brain-scene.js` e `brain-stage.tsx`.

Handoff completo (12 defeitos + CD-01 a CD-09, especificação, plano em fases): documento "Handoff técnico: auditoria e plano de refatoração do cérebro 3D", no Claude.
