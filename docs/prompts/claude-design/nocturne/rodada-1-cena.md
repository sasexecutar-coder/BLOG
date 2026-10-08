# Rodada 1 — só a cena (versão Nocturne)

> Adaptação de `../MENSAGEM-ORIGINAL.md`. Mudanças em `MAPEAMENTO.md`. **Não executado.**

## Anexar antes de enviar (caminhos do repositório)

- `apps/blog/app/brain/brain-hollow.js`, `apps/blog/app/brain/brain-scene.js`, `apps/blog/pipeline/build-brain-assets.js`
- `apps/blog/public/models/home-brain/brain-surface.glb`, `brain-particles.bin`, `brain-particles-attr.bin`
- `docs/provenance/build-report.json`
- `apps/blog/design-system/nocturne/styles.css` (design system, fonte de verdade) e `readme.md`
- `apps/blog/prototypes/brain/Brain View.html` (de onde vem o bloco do tema claro)
- `docs/prompts/claude-design/referencias/` (3 prints do globo, 3 do cérebro atual, colagem)

Se o Claude Design não aceitar upload, cole o código do `brain-hollow.js` no texto.

## Prompt

```
Contexto
Protótipo da cena 3D da home do site Risco Cognitivo (seção "Entenda sua execução"). Referência visual: o globo "Region: Earth" de cloudflare.com (prints anexos). Hoje o cérebro é uma malha cinza opaca com pontos aleatórios por cima; quero a mesma linguagem do globo: uma única linguagem de pontos, com grade fina de contornos, sem malha visível.

Design system
O design system é o Nocturne (styles.css e readme.md anexos). Ele é a fonte de verdade: toda cor, fonte, espaço, raio e sombra vem das variáveis dele. Não use hex, nome de fonte nem px que um token já cubra, nem branco ou preto puros. Não recupere paletas anteriores (laranja ou índigo).

Formato
Use o formato 3D object (three-d-stage). Three.js 0.184.0 com o importmap fixado do starter. Os anexos brain-hollow.js, brain-scene.js e os .glb/.bin são a base: reaproveite, não reescreva do zero. Use a malha do brain-surface.glb anexado; não troque a anatomia nem gere uma malha substituta.

Tela alvo: mobile 393×852 primeiro (moldura de celular), depois desktop.

Requisitos da cena
1. Sem malha visível. Só pontos + linhas de contorno (13 latitudes, 9 meridianos, como em brain-hollow.js). Parâmetro ?back=occlude|xray:
   - occlude: malha como oclusor invisível (colorWrite=false, depthWrite=true, desenhada antes dos pontos), sem pontos da face de trás.
   - xray: face de trás com alfa ≤ 0.08.
   Padrão: occlude.
2. Câmera: o brain-hollow.js fixa uCam/uRef em 6.6. Remova isso. Calcule a distância câmera→alvo a cada frame e passe ao shader, para o tamanho do ponto e o fade por profundidade não quebrarem ao reenquadrar.
3. Enquadramento: pela esfera justa dos pontos (maior distância ao centroide), não pela caixa (getBoundingSphere). Na vista lateral o cérebro deve ocupar 75–80% da largura útil em 393 pt. Altura do palco ≈ 1.1 × diâmetro da esfera.
4. Pontos: troque o sorteio aleatório por amostragem blue-noise (distância mínima, semente fixa). Se ficar lento no navegador (> 300 ms), mantenha os pontos atuais e me diga.
5. Cor por tokens, nada de hex no JS. Crie brain-tokens.css só com aliases do Nocturne e leia os valores no JS via getComputedStyle:
   --brain-accent: var(--color-accent);
   --brain-bg: var(--color-bg);
   --brain-dot-peak: var(--color-accent);
   --brain-dot-ambient: color-mix(in srgb, var(--color-accent) 12%, transparent);
   --brain-rim: var(--color-accent-700);
   Dois temas, troca por ?theme=noite|claro:
   - Noite (padrão): tokens do Nocturne como estão, blending aditivo, pontos ambientes ≈12% de opacidade, picos a 100%.
   - Claro (provisório): aplique o bloco [data-rc-theme="light"] do Brain View.html anexo; pontos de tinta, sem blending aditivo.
6. Aro/halo fino em volta da silhueta (token --brain-rim).
7. Controles: só rotação em torno do eixo y. Sem zoom, sem pan, sem toolbar de download, sem sombra de chão, sem nota "Drag to orbit". touch-action: pan-y no canvas (a página precisa rolar com o dedo sobre o cérebro). Rotação automática ≈ 1 volta em 55 s; retomar 3 s depois de soltar. prefers-reduced-motion: sem rotação.
8. Resolução: pixelRatio até 3.
9. Parâmetros de teste: ?angle=lateral|posterior|frontal&freeze=1 congela o ângulo para capturas comparáveis.
10. Painel ?debug=1 com: largura do cérebro em % da largura da tela, ms de inicialização, nº de pontos desenhados, distância da câmera.

Não faça
- Não invente dados, textos ou regiões anatômicas.
- Não adicione marcadores nem callouts nesta rodada.
- Não use localStorage.

Entrega
Um HTML funcionando, o brain-tokens.css e um resumo curto: o que mudou em relação ao brain-hollow.js, o que não consegui fazer e por quê, e os valores do painel de debug nos 3 ângulos, nos dois temas.

Aceite (confira antes de entregar)
- Com a malha oculta, o cérebro continua reconhecível só pelos pontos nos 3 ângulos.
- Largura ≥ 75% na vista lateral em 393 pt.
- Ponto com o mesmo tamanho aparente em zoom de enquadramento 0.8×, 1× e 1.25×.
- Funciona nos dois temas.
- Nenhum hex no JS nem no brain-tokens.css.
```
