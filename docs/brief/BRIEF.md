# Brief canônico — cérebro editorial em camadas

## Resultado

Objeto reconhecível com hemisférios e sulcos. Cerebelo e tronco fazem parte do objetivo visual, desde que obtidos da mesma anatomia com procedência. O cérebro deve conservar forma e leitura de volume mesmo quando os pontos forem ocultados. A forma não deve ser substituída por uma esfera, ovo, conjunto de elipsoides ou reconstrução arbitrária a partir dos pontos.

## Camadas e parâmetros para o painel de revisão

| Camada | Função | Controle obrigatório |
| --- | --- | --- |
| Fundo | Branco limpo | cor |
| Superfície | Sustentar silhueta e sulcos | visibilidade, material, opacidade, rugosidade |
| Pontos | Linguagem visual do globo | visibilidade, densidade, raio, cor, opacidade |
| Linhas | Apoio discreto à leitura espacial | visibilidade, cor, intensidade |
| Luz | Revelar relevo sem aspecto plástico | ambiente, principal, preenchimento |
| Câmera | Enquadramento sem cortes | vista, distância, zoom limitado, reset |
| Movimento | Exploração controlável | velocidade, pausa, arraste |
| Marcadores | Acesso aos conceitos | seleção e painel de conteúdo independente |

A referência é o efeito visual, não uma afirmação de que a Cloudflare usa a mesma técnica. Evitar uma capa transparente que apenas acumule pontos da frente e das costas. Preferir superfície que oclua o verso e pontos posicionados ligeiramente acima dela; se houver transparência, validar ordenação de profundidade e ausência de artefatos. A grade não precisa reproduzir todos os triângulos da anatomia: ruído visual deve permanecer baixo.

## Identidade

Fonte de verdade: `tokens.css`, originada dos valores explícitos enviados pelo usuário. Branco `#FFFFFF`, texto `#111111`, suporte `#6B6F76`, marca `#F56A1C`, pontos `#F3A06B`, cinza estrutural `#E9E7E3`. A fonte Inter é preferência com fallback; arquivo de fonte não incluído. Não tratar os valores como CSS oficial Cloudflare. Aliases novos só podem derivar dessa fonte e devem ser documentados.

Laranja e tons claros são adequados para decoração; validar contraste antes de empregá-los como texto pequeno ou foco. Marcadores e controles devem ter área de toque de ao menos 44px, descrição textual, foco e operação por teclado. As funções executivas são redes distribuídas; os quatro marcadores representam conceitos.

## Escopo desta etapa

Aprovar o objeto e seus controles primeiro. Home, `/mapas/`, conteúdo editorial e lote de cards reutilizarão o objeto aprovado. No mobile, os cards explicativos ficam abaixo; no desktop, podem ficar ao lado. Os rótulos são HTML separado do GLB.
