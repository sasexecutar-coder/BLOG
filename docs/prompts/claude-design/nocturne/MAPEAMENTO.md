# Adaptação dos prompts ao Nocturne (proposta para D-006)

Versão dos prompts de `../MENSAGEM-ORIGINAL.md` / `../extras/` ajustada ao design system **Nocturne** (SoT,
`apps/blog/design-system/nocturne/styles.css`). Os originais continuam intactos. **Nada foi executado.**

## Regra

Os tokens do cérebro são **aliases derivados** do Nocturne, declarados num arquivo `brain-tokens.css` que só referencia
`var(--color-*)`. Nenhum hex novo. Isso segue o BRIEF ("aliases novos só podem derivar da fonte e devem ser documentados")
e o readme do Nocturne ("nunca hard-code um hex que um token já carregue").

## Mapeamento proposto

| Token pedido no prompt original | Valor original | Proposta Nocturne | Justificativa |
| --- | --- | --- | --- |
| `--brain-accent` | `#6E72E8` | `var(--color-accent)` (#9184d9) | Acento único do DS |
| `--brain-bg` | Noite `#151414` · Claro `#FFFFFF` | `var(--color-bg)` | O fundo vem do tema; o DS proíbe preto e branco puros |
| `--brain-dot-peak` | "picos a 100%" | `var(--color-accent)` | Pico = acento, como no globo (pico ≈ cor da marca) |
| `--brain-dot-ambient` | "≈12% de opacidade" | `color-mix(in srgb, var(--color-accent) 12%, transparent)` | Mesmos 12% do briefing, derivados do acento |
| `--brain-rim` | — | `var(--color-accent-700)` | O readme do DS manda usar os passos 700–900 para bordas sutis no fundo escuro |
| `--text-primary` | — | `var(--color-text)` | Token de texto do DS |
| `--text-secondary` | — | `color-mix(in srgb, var(--color-text) 55%, transparent)` | Mesma fórmula da classe `.text-muted` do DS |
| Marcador selecionado: "preenchido, ícone branco" | branco | fundo `var(--color-accent-800)`, ícone `var(--color-accent-100)`, anel `var(--color-accent-400)` | Padrão já usado em `Brain View.html`; sem branco puro |
| Tipografia | DM Sans + Inter (briefing) | `var(--font-heading)` / `var(--font-body)` (Inter) | O DS só tem Inter |

## Temas

- **Noite (padrão):** os tokens do Nocturne como estão.
- **Claro (provisório):** o bloco `[data-rc-theme="light"]` já usado em `apps/blog/prototypes/brain/Brain View.html`
  (fundo `#f3f5fe`, acento `#796cbf`). Ele fica **fora** do DS, com hex literais, e por isso é provisório até decidir D-005.

## Contrastes calculados (fórmula WCAG 2.x, sobre os hex dos tokens)

| Par | Contraste | Meta |
| --- | ---: | --- |
| Noite: contorno do marcador `--color-accent` × `--color-bg` | 5,45:1 | ≥ 3:1 ✅ |
| Claro: contorno `#796cbf` × fundo `#f3f5fe` | 4,10:1 | ≥ 3:1 ✅ |
| Noite: ícone selecionado `accent-100` × `accent-800` | 9,42:1 | ≥ 3:1 ✅ |
| Claro: ícone selecionado `#2b2741` × `#e7e5fe` | 11,60:1 | ≥ 3:1 ✅ |
| Noite: aro `accent-700` × `bg` | 2,60:1 | decorativo, sem meta |

Contraste calculado sobre cores sólidas; com blending aditivo e transparência, o resultado em tela precisa ser medido no protótipo.

## O que mudou em relação aos originais

1. Cores: todos os hex saíram; os tokens `--brain-*` viraram aliases do Nocturne (tabela acima).
2. Tema Claro: deixou de usar `#FFFFFF` e passou a usar o bloco claro do protótipo, marcado como provisório.
3. Marcador selecionado: "ícone branco" virou o padrão do protótipo (`accent-800` / `accent-100` / anel `accent-400`).
4. Anexos: `styles.css` do Nocturne e `Brain View.html` (para o bloco claro) entram no lugar do `tokens.css`; a lista usa
   os caminhos do repositório.
5. Malha: o prompt passa a dizer explicitamente para usar o GLB anexado (`sub-01`) e não trocar a anatomia, já que a
   pendência fsaverage × `sub-01` do ADR-001 está aberta.
6. Acréscimos vindos do readme do Nocturne (não estavam no original): ícones Phosphor; foco `:focus-visible` de 2 pt no
   acento; callout sem deslocamento sob `prefers-reduced-motion`; aceite extra "nenhum hex no JS nem no `brain-tokens.css`";
   pedir os números do `?debug=1` nos dois temas.
7. **Sem mudança:** requisitos técnicos 1–4 e 7–10 da rodada 1, regras de marcador e callout, textos exatos dos callouts,
   parâmetros de teste, painel `?debug=1` e critérios de aceite.

## Ainda em aberto

- D-005 (tema claro dentro ou fora do DS).
- Conflito 6 do ADR-002: os textos do prompt divergem dos do protótipo atual; a versão adaptada mantém os do prompt.
- Conflito 1 do ADR-002 (sem malha visível × superfície sólida) continua dependendo do aceite do ADR-002.
