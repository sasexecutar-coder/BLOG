# Mensagem original (texto recebido, sem alterações)

> Colado pelo usuário em 2026-10-08 junto com o pacote `risco-cognitivo-cerebro-3d.zip`. Preservado como veio, inclusive
> as frases em primeira pessoa e a referência a "IMG_3301". As versões adaptadas para o pacote (com referência às pastas)
> estão em `extras/` e em `01_PROMPT.md`. **Nada deste texto foi executado.**

Sim, mas envie em duas rodadas e com os arquivos anexados. Um prompt só com a cena, os marcadores e os callouts tende a sair raso. Nenhum prompt de lá controlei, então a lista de anexos assume que o Claude Design aceita upload. Se não aceitar, cole o código do `brain-hollow.js` no texto.
Anexe antes de enviar

* `brain-hollow.js`, `brain-scene.js` (se tiver), `build-brain-assets.js`
* `brain-surface.glb`, `brain-particles.bin`, `brain-particles-attr.bin`, `build-report.json`
* Os 3 prints do globo, os 3 do cérebro atual e a colagem (IMG_3301)
* `tokens.css`, se puder

Rodada 1: só a cena

```
Contexto
Protótipo da cena 3D da home do site Risco Cognitivo (seção "Entenda sua execução"). Referência visual: o globo "Region: Earth" de cloudflare.com (prints anexos). Hoje o cérebro é uma malha cinza opaca com pontos índigo aleatórios por cima; quero a mesma linguagem do globo: uma única linguagem de pontos, com grade fina de contornos, sem malha visível.

Formato
Use o formato 3D object (three-d-stage). Three.js 0.184.0 com o importmap fixado do starter. Os anexos brain-hollow.js, brain-scene.js e os .glb/.bin são a base: reaproveite, não reescreva do zero.

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
- Não adicione marcadores nem callouts nesta rodada.
- Não use localStorage.

Entrega
Um HTML funcionando e um resumo curto: o que mudou em relação ao brain-hollow.js, o que não consegui fazer e por quê, e os valores do painel de debug nos 3 ângulos.

Aceite (confira antes de entregar)
- Com a malha oculta, o cérebro continua reconhecível só pelos pontos nos 3 ângulos.
- Largura ≥ 75% na vista lateral em 393 pt.
- Ponto com o mesmo tamanho aparente em zoom de enquadramento 0.8×, 1× e 1.25×.
- Funciona nos dois temas.

```

Rodada 2: marcadores e callouts (só depois de aprovar a cena)

```
Sobre a cena aprovada, adicione marcadores e callouts.

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

Aceite
- 0 interseções marcador × texto nos 4 callouts, em 320, 393 e 768 px de largura.
- ≥ 2 marcadores visíveis em todo o giro de 360° (me mostre a contagem a cada 30°).
- Contorno do marcador ≥ 3:1 contra o fundo nos dois temas.

```

Três avisos antes de enviar:

* O starter 3D foi feito para exibir e exportar objetos. Pedi para desligar toolbar, sombra e zoom, porque ele cria tudo isso por padrão.
* Os valores de movimento (55 s por volta, 240 ms de entrada) são propostas minhas, não medidas da Cloudflare. Se tiver uma gravação de tela do globo, mande junto na rodada 2.
* Peça os números do painel `?debug=1` nas respostas. Eles viram o seu teste de aceite, e você compara com o handoff sem depender de olho.
