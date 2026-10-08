## FASE 1: SÓ A CENA

Contexto
Protótipo da cena 3D da home do site Risco Cognitivo (seção "Entenda sua execução"). Referência visual: o globo "Region: Earth" de cloudflare.com (pasta referencias/globo-cloudflare). Hoje o cérebro é uma malha cinza opaca com pontos índigo aleatórios por cima (pasta referencias/cerebro-atual). Quero a mesma linguagem do globo: uma única linguagem de pontos, com grade fina de contornos, sem malha visível.

Formato
Use o formato 3D object (three-d-stage). Three.js 0.184.0 com o importmap fixado do starter. Os arquivos em codigo/ (brain-hollow.js, build-brain-assets.js, three-d-stage.js) e os ativos (.glb/.bin, se anexados) são a base: reaproveite, não reescreva do zero.

Tela alvo: mobile 393×852 primeiro (moldura de celular), depois desktop.

Requisitos da cena
1. Sem malha visível. Só pontos + linhas de contorno (13 latitudes, 9 meridianos, como em brain-hollow.js). Parâmetro ?back=occlude|xray:
   - occlude: malha como oclusor invisível (colorWrite=false, depthWrite=true, desenhada antes dos pontos), sem pontos da face de trás.
   - xray: face de trás com alfa ≤ 0.08.
   Padrão: occlude.
2. Câmera: o brain-hollow.js fixa uCam/uRef em 6.6. Remova isso. Calcule a distância câmera→alvo a cada frame e passe ao shader, para o tamanho do ponto e o fade por profundidade não quebrarem ao reenquadrar.
3. Enquadramento: pela esfera justa dos pontos (maior distância ao centroide), não pela caixa (getBoundingSphere). Na vista lateral o cérebro deve ocupar 75–80% da largura útil em 393 pt. Altura do palco ≈ 1.1 × diâmetro da esfera.
4. Pontos: troque o sorteio aleatório por amostragem blue-noise (distância mínima, semente fixa). Se ficar lento no navegador (> 300 ms), mantenha os pontos atuais e me diga.
5. Cor por tokens CSS em :root, nada de hex no JS: --brain-accent (#6E72E8), --brain-dot-ambient, --brain-dot-peak, --brain-rim, --brain-bg. Dois temas: Claro (fundo #FFFFFF, pontos de tinta) e Noite (fundo #151414, blending aditivo, pontos ambientes ≈12% de opacidade, picos a 100%). Troca por ?theme=claro|noite.
6. Aro/halo fino em volta da silhueta (token --brain-rim).
7. Controles: só rotação em torno do eixo y. Sem zoom, sem pan, sem toolbar de download, sem sombra de chão, sem nota "Drag to orbit". touch-action: pan-y no canvas (a página precisa rolar com o dedo sobre o cérebro). Rotação automática ≈ 1 volta em 55 s; retomar 3 s depois de soltar. prefers-reduced-motion: sem rotação.
8. Resolução: pixelRatio até 3.
9. Parâmetros de teste: ?angle=lateral|posterior|frontal&freeze=1 congela o ângulo para capturas comparáveis.
10. Painel ?debug=1 com: largura do cérebro em % da largura da tela, ms de inicialização, nº de pontos desenhados, distância da câmera.

Não faça
- Não invente dados, textos ou regiões anatômicas.
- Não adicione marcadores nem callouts nesta fase.
- Não use localStorage.

Entrega da Fase 1
Um HTML funcionando e um resumo curto: o que mudou em relação ao brain-hollow.js, o que não consegui fazer e por quê, e os valores do painel de debug nos 3 ângulos.

Aceite da Fase 1 (confira antes de entregar)
- Com a malha oculta, o cérebro continua reconhecível só pelos pontos nos 3 ângulos.
- Largura ≥ 75% na vista lateral em 393 pt.
- Ponto com o mesmo tamanho aparente em zoom de enquadramento 0.8×, 1× e 1.25×.
- Funciona nos dois temas.
