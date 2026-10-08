# Rodada 2 — marcadores e callouts (versão Nocturne)

> Só depois de aprovar a cena da rodada 1. Adaptação de `../MENSAGEM-ORIGINAL.md`; mudanças em `MAPEAMENTO.md`.
> **Não executado.** Se houver gravação de tela do globo, anexe nesta rodada (valida tempos e easings).

## Prompt

```
Sobre a cena aprovada, adicione marcadores e callouts. Continue no design system Nocturne: só tokens, sem hex, sem branco ou preto puros.

Marcadores (4, ancorados na superfície com anchor(dir) do brain-hollow.js, calculados uma vez e guardados):
- Planejamento (ícone calendário), Controle inibitório (círculo cortado), Memória de trabalho (dois quadrados), Flexibilidade (setas de atualizar). Ícones Phosphor, como manda o readme do Nocturne.
- Círculo de 36 pt, alvo de toque de 44 pt. Padrão: contorno de 2 pt em --brain-accent. Selecionado: fundo var(--color-accent-800), ícone var(--color-accent-100), anel var(--color-accent-400).
- Somem com fade quando passam para o lado oposto. Em qualquer ângulo, pelo menos 2 marcadores visíveis (escolha as direções das âncoras para isso e liste-as).
- São <button> com aria-pressed. Foco de teclado com :focus-visible de 2 pt em var(--color-accent).

Callout (um por vez):
- Borda tracejada de 1.5 pt, 4 colchetes de canto, título em var(--color-text) e descrição em color-mix(in srgb, var(--color-text) 55%, transparent), sem preenchimento. Só use fundo var(--color-surface) a 85% se houver sobreposição com pontos. Fonte: var(--font-heading) no título, var(--font-body) na descrição.
- Posicionado no quadrante livre, fora da silhueta projetada, ligado ao marcador por uma haste curta. O marcador NUNCA fica sobre a caixa de texto. Padding do lado do marcador = raio do marcador + 8 pt.
- Dentro da área segura de 16 pt de cada borda. Cobertura do callout sobre o cérebro ≤ 20% da área do objeto.
- Textos exatos (não altere):
  Planejamento: "Define metas, organiza passos e prioriza ações."
  Controle inibitório: "Ajuda a focar e evitar distrações."
  Memória de trabalho: "Mantém e manipula informações no curto prazo."
  Flexibilidade: "Permite adaptar estratégias e lidar com mudanças."
- Entrada: fade + 8 pt, 240 ms ease-out. Saída: fade, 160 ms. Troca automática só 6 s depois da última interação. Toque no marcador substitui o automático; Esc ou toque fora fecha. Com prefers-reduced-motion, sem deslocamento.

Parâmetros de teste: ?callout=0..3 abre um callout fixo e congela a troca automática.

Painel ?debug=1, acrescente: cobertura do callout sobre o cérebro (%), nº de marcadores visíveis, interseção marcador × texto (deve ser 0), caracteres de texto fora da área segura (deve ser 0).

Aceite
- 0 interseções marcador × texto nos 4 callouts, em 320, 393 e 768 px de largura.
- ≥ 2 marcadores visíveis em todo o giro de 360° (me mostre a contagem a cada 30°).
- Contorno do marcador ≥ 3:1 contra o fundo nos dois temas.
```
