# Pacote: protótipo do cérebro 3D (Risco Cognitivo)

## Como usar (3 passos)
1. Copie para FALTA-ADICIONAR/ os arquivos listados no LEIA-ME.txt de lá. Os .glb/.bin e o brain-scene.js são os mais importantes.
2. No Claude Design, abra um projeto no formato 3D object e anexe o conteúdo do pacote (todas as pastas e os .md). Se ele não aceitar .zip nem pastas, anexe os arquivos soltos nesta ordem de prioridade: 02_BRIEFING, codigo/, ativos de FALTA-ADICIONAR/, referencias/.
3. Cole o texto de 01_PROMPT.md na conversa. Ele trabalha em duas fases e para depois da Fase 1; responda "aprovado" para liberar a Fase 2.

## Conteúdo
| Item | Para quê |
|---|---|
| 01_PROMPT.md | Prompt único em duas fases (cena → marcadores e callouts) |
| 02_BRIEFING-auditoria.md | Diagnóstico, medidas, defeitos e critérios de aceite |
| codigo/ | three-d-stage.js, build-brain-assets.js, brain-hollow.js (do time) |
| referencias/globo-cloudflare/ | 3 prints do globo (alvo visual) |
| referencias/cerebro-atual/ | 3 prints do cérebro atual (o que mudar) |
| referencias/colagem-globo-vs-cerebro.jpeg | Os 6 prints lado a lado |
| FALTA-ADICIONAR/ | Lista do que ainda precisa ser copiado |
| extras/ | As duas fases em arquivos separados, caso o prompt único fique longo demais |

## Como conferir o resultado
Peça sempre os números do painel ?debug=1 e compare com as metas:
- Largura do cérebro na vista lateral ≥ 75% da tela (hoje 56%)
- Cobertura do callout ≤ 20% da área do cérebro (hoje ≈51%)
- Interseção marcador × texto = 0 (hoje 2 de 2 callouts cortados)
- Marcadores visíveis ≥ 2 em todo o giro de 360°
- Contorno do marcador ≥ 3:1 contra o fundo (hoje 2,3:1)

## Limites
- Não conheço os limites de upload do Claude Design. Se rejeitar o pacote, use os extras/ e anexe menos arquivos.
- Os tempos de animação e a velocidade de rotação dos prompts são propostas minhas, não medidas da Cloudflare.
- O handoff completo está no documento do Claude (não incluído aqui). Se quiser no zip, exporte-o como PDF ou Markdown e coloque na raiz.
