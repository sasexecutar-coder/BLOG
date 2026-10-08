# Prompt para o Claude Design operando neste repositório (Rodada 1)

> Para colar no Claude Design com o repositório `sasexecutar-coder/BLOG` anexado como codebase, no branch
> `claude/upbeat-bohr-15zbso` (o `main` só tem o commit inicial vazio até o PR #1 ser mesclado).
> Usa a proposta de tokens D-006 (`MAPEAMENTO.md`). A Rodada 2 está em `rodada-2-marcadores-callouts.md`: só envie
> depois de aprovar esta.

```
Projeto: Risco Cognitivo — cérebro 3D da home (HOME-BRAIN-001). Rodada 1 de 2: só a cena.

O repositório anexado é a fonte de tudo. Leia nesta ordem antes de começar:
1. README.md (stack, estrutura e regras)
2. docs/adr/ADR-002-cerebro-linguagem-unica-de-pontos.md (a decisão que você vai prototipar)
3. docs/prompts/claude-design/nocturne/MAPEAMENTO.md (tokens do cérebro como aliases do design system)
4. docs/prompts/claude-design/02_BRIEFING-auditoria.md (defeitos e metas medidas)
5. apps/blog/design-system/nocturne/readme.md e styles.css (design system — fonte de verdade)

Base de código e assets (reaproveite, não reescreva do zero, não altere):
- apps/blog/app/brain/brain-hollow.js e brain-scene.js
- apps/blog/public/models/home-brain/brain-surface.glb, brain-particles.bin, brain-particles-attr.bin
- docs/provenance/build-report.json (transformação, contagens, hashes)
- apps/blog/prototypes/brain/Brain View.html (padrões de UI e o bloco do tema claro)
- reference/design-starter/three-d-stage.js (starter do formato 3D object)
Referências visuais: docs/prompts/claude-design/referencias/ (globo Cloudflare, cérebro atual, colagem).
Use o brain-surface.glb do repositório; não troque a anatomia nem gere malha substituta. Se algum arquivo listado não abrir, diga qual antes de começar e não invente o conteúdo dele.

Objetivo
A mesma linguagem do globo "Region: Earth" de cloudflare.com: uma única linguagem de pontos, com grade fina de contornos e aro, sem malha visível. Seção "Entenda sua execução" da home.

Formato
3D object (three-d-stage). Three.js 0.184.0 com o importmap fixado do starter. Tela alvo: mobile 393×852 primeiro (moldura de celular), depois desktop.

Design system
Nocturne é a fonte de verdade: toda cor, fonte, espaço, raio e sombra vem das variáveis de styles.css. Sem hex, nome de fonte ou px que um token cubra; sem branco ou preto puros; não recupere as paletas arquivadas em docs/archive/design-superseded/.

Requisitos da cena
1. Sem malha visível. Só pontos + linhas de contorno (13 latitudes, 9 meridianos, como em brain-hollow.js). Parâmetro ?back=occlude|xray:
   - occlude: malha como oclusor invisível (colorWrite=false, depthWrite=true, desenhada antes dos pontos), sem pontos da face de trás.
   - xray: face de trás com alfa ≤ 0.08.
   Padrão: occlude.
2. Câmera: brain-hollow.js fixa uCam/uRef em 6.6. Remova isso. Calcule a distância câmera→alvo a cada frame e passe ao shader, para o tamanho do ponto e o fade por profundidade não quebrarem ao reenquadrar.
3. Enquadramento pela esfera justa dos pontos (maior distância ao centroide), não pela caixa (getBoundingSphere). Na vista lateral o cérebro ocupa 75–80% da largura útil em 393 pt. Altura do palco ≈ 1.1 × diâmetro da esfera.
4. Pontos: troque o sorteio aleatório por amostragem blue-noise (distância mínima, semente fixa). Se ficar lento no navegador (> 300 ms), mantenha os pontos atuais e me diga.
5. Cor só por tokens, nada de hex no JS. Crie brain-tokens.css apenas com aliases do Nocturne e leia os valores no JS via getComputedStyle:
   --brain-accent: var(--color-accent);
   --brain-bg: var(--color-bg);
   --brain-dot-peak: var(--color-accent);
   --brain-dot-ambient: color-mix(in srgb, var(--color-accent) 12%, transparent);
   --brain-rim: var(--color-accent-700);
   Temas por ?theme=noite|claro:
   - noite (padrão): tokens do Nocturne como estão, blending aditivo, pontos ambientes ≈12% de opacidade, picos a 100%.
   - claro (provisório): o bloco [data-rc-theme="light"] de Brain View.html; pontos de tinta, sem blending aditivo.
6. Aro fino em volta da silhueta (--brain-rim).
7. Controles: só rotação em y. Sem zoom, pan, toolbar de download, sombra de chão ou nota "Drag to orbit" (o starter cria tudo isso por padrão: desligue). touch-action: pan-y no canvas. Rotação automática ≈ 1 volta em 55 s; retomar 3 s depois de soltar. prefers-reduced-motion: sem rotação.
8. pixelRatio até 3.
9. ?angle=lateral|posterior|frontal&freeze=1 congela o ângulo para capturas comparáveis.
10. Painel ?debug=1: largura do cérebro em % da tela, ms de inicialização, nº de pontos desenhados, distância da câmera.

Não faça
- Não invente dados, textos ou regiões anatômicas.
- Não adicione marcadores nem callouts nesta rodada.
- Não use localStorage.
- Não altere arquivos do repositório nem o pipeline; entregue arquivos novos.

Entrega (e PARE aqui; a rodada 2 só vem depois da minha aprovação)
- O HTML da cena, o brain-tokens.css e o JS da cena como arquivos separados, prontos para ir em apps/blog/prototypes/brain-pontos/.
- Resumo curto: o que mudou em relação ao brain-hollow.js, o que não conseguiu fazer e por quê.
- Valores do painel ?debug=1 nos 3 ângulos, nos dois temas (6 linhas).

Aceite (confira antes de entregar)
- Com a malha oculta, o cérebro é reconhecível só pelos pontos nos 3 ângulos.
- Largura ≥ 75% na vista lateral em 393 pt.
- Ponto com o mesmo tamanho aparente em zoom de enquadramento 0.8×, 1× e 1.25×.
- Funciona nos dois temas.
- Nenhum hex no JS nem no brain-tokens.css.
```
