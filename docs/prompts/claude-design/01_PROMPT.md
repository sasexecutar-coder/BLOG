# PROMPT ÚNICO (cole no Claude Design, com os arquivos da pasta anexados)

Você vai prototipar a cena 3D da home do Risco Cognitivo. Anexei: codigo/ (3 arquivos do time), referencias/ (6 prints + 1 colagem), 02_BRIEFING-auditoria.md (diagnóstico com números medidos) e, se existirem, os ativos em FALTA-ADICIONAR/ (GLB, bins, build-report.json, tokens.css).

Leia primeiro 02_BRIEFING-auditoria.md: ele explica por que o cérebro atual não tem a fidelidade do globo da Cloudflare e traz as metas medidas.

Trabalhe em DUAS FASES. Entregue a Fase 1 e PARE. Só comece a Fase 2 quando eu responder "aprovado".

Se faltar algum arquivo que a tarefa exige (por exemplo o GLB), diga qual falta antes de começar e proponha o que fará sem ele. Não invente conteúdo.

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

---

## FASE 2: MARCADORES E CALLOUTS (sobre a cena aprovada)

Marcadores (4, ancorados na superfície com anchor(dir) do brain-hollow.js, calculados uma vez e guardados):
- Planejamento (ícone calendário), Controle inibitório (círculo cortado), Memória de trabalho (dois quadrados), Flexibilidade (setas de atualizar).
- Círculo de 36 pt, alvo de toque de 44 pt. Padrão: contorno de 2 pt em --brain-accent. Selecionado: preenchido, ícone branco, com anel.
- Somem com fade quando passam para o lado oposto. Em qualquer ângulo, pelo menos 2 marcadores visíveis (escolha as direções das âncoras para isso e liste-as).
- São <button> com aria-pressed.

Callout (um por vez):
- Borda tracejada de 1.5 pt, 4 colchetes de canto, texto em --text-primary (título) e --text-secondary (descrição), sem preenchimento. Só use fundo de superfície a 85% se houver sobreposição com pontos.
- Posicionado no quadrante livre, fora da silhueta projetada, ligado ao marcador por uma haste curta. O marcador NUNCA fica sobre a caixa de texto. Padding do lado do marcador = raio do marcador + 8 pt.
- Dentro da área segura de 16 pt de cada borda. Cobertura do callout sobre o cérebro ≤ 20% da área do objeto.
- Textos exatos (não altere):
  Planejamento: "Define metas, organiza passos e prioriza ações."
  Controle inibitório: "Ajuda a focar e evitar distrações."
  Memória de trabalho: "Mantém e manipula informações no curto prazo."
  Flexibilidade: "Permite adaptar estratégias e lidar com mudanças."
- Entrada: fade + 8 pt, 240 ms ease-out. Saída: fade, 160 ms. Troca automática só 6 s depois da última interação. Toque no marcador substitui o automático; Esc ou toque fora fecha.

Parâmetros de teste: ?callout=0..3 abre um callout fixo e congela a troca automática.

Painel ?debug=1, acrescente: cobertura do callout sobre o cérebro (%), nº de marcadores visíveis, interseção marcador × texto (deve ser 0), caracteres de texto fora da área segura (deve ser 0).

Aceite da Fase 2
- 0 interseções marcador × texto nos 4 callouts, em 320, 393 e 768 px de largura.
- ≥ 2 marcadores visíveis em todo o giro de 360° (me mostre a contagem a cada 30°).
- Contorno do marcador ≥ 3:1 contra o fundo nos dois temas.
