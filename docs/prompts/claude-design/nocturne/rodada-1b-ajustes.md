# Rodada 1b — ajustes da cena antes dos marcadores

> Responder ao agente do Claude Design depois da entrega da rodada 1 (`apps/blog/prototypes/brain-pontos/`).
> Base: números da rodada 1 conferidos neste repositório (iguais aos do agente) e diagnóstico da profundidade sulcal.
> **Não executado aqui.**

```
Rodada 1 aprovada com ajustes. Antes dos marcadores, faça a rodada 1b sobre os mesmos arquivos (Brain Pontos.html, brain-pontos.js, brain-tokens.css). Mantenha tudo o que já passou no aceite.

1. Giros visíveis (o problema principal). A profundidade do brain-particles-attr.bin satura porque depth01() do build só gradua sulc entre -0,6 e 0,9, e os dados vão de -12,7 a 16,2. Não use esse byte. Use o atributo _SULC do brain-surface.glb (contínuo, por vértice; positivo = sulco, negativo = giro), pelo mesmo vértice mais próximo que você já usa para a normal. Normalize por hemisfério entre os percentis 10 e 90 do _SULC. Cerebelo e tronco ficam com valor fixo.
   - Coroa do giro → pico; fundo do sulco → ambiente. Combine com a orientação para a câmera que você já calcula (multiplicar os dois).
   - Afine a densidade no fundo do sulco (descartar parte dos pontos com profundidade alta antes do blue-noise), para que os giros apareçam também pela distribuição.
2. Paleta: continua o Nocturne. Não troque a paleta, só o token do pico no tema noite: --brain-dot-peak: var(--color-accent-300). O contorno do marcador (rodada 2) continua em --brain-accent.
3. Aro no claro: no bloco html[data-rc-theme="light"] do brain-tokens.css, use --brain-rim: var(--color-accent-400), porque a rampa clara é invertida e o 700 quase some no fundo claro.
4. Painel ?debug=1, acrescente: faixa de _SULC usada (p10, p90) e % de pontos acima de 80% de pico.

Não faça
- Não altere a paleta do design system nem crie hex fora do brain-theme-light.css.
- Não adicione marcadores nem callouts.

Entrega
- Os mesmos arquivos atualizados.
- Tabela do ?debug=1 nos 3 ângulos × 2 temas (como antes), mais as duas métricas novas.
- Capturas da vista lateral nos dois temas, antes e depois.

Aceite
- Na vista lateral, com freeze=1, os giros do lobo frontal e do temporal aparecem como faixas mais claras (noite) ou mais escuras (claro), sem depender da silhueta.
- Largura lateral continua ≥ 75%; nenhum hex no JS nem no brain-tokens.css; os dois temas funcionam.
```

## Notas para o repositório

- Os tokens novos que o agente criou (`--brain-grid`, `--brain-rim-glow`) e os ajustes acima (`--brain-dot-peak` no
  noite, `--brain-rim` no claro) entram na proposta D-006 quando aprovados.
- A largura de 58–59% nas vistas posterior e frontal é esperada: a meta de 75–80% vale só para a lateral, porque o cérebro
  é mais comprido que largo.
- A saturação de `depth01()` é um defeito do pipeline (`apps/blog/pipeline/build-brain-assets.js`). Corrigir lá muda
  `brain-particles-attr.bin` e os hashes do `build-report.json`, então fica como decisão separada.
