# Decisões em aberto e conflitos entre as entradas

Origem: `CLAUDE-DESIGN-BRAIN-001.zip` (pacote de entrada v2.0.0, `PREPARED`) e `Archive.zip` (saída posterior do
Claude Design, gerada em 2026-10-06 com a malha). Itens abertos precisam de decisão do responsável antes do app.

## Abertas

### D-001 — Paleta: laranja (pacote) × índigo (Archive)

| | Pacote Brain (`tokens.css` ativo) | Archive (`tokens.indigo-archive.css`) |
| --- | --- | --- |
| Marca | `#F56A1C` | `#6E72F0` ("Colosseum ref: indigo engraving") |
| Pontos | `#F3A06B` | `#9099F6` |
| Neutros | quentes (`#F7F5F3`, `#E8E5E1`) | frios (`#F5F5F5`, `#E6E6EA`) |

- O `brain-visual-config.json` do Archive (usado nos assets em `public/`) está em **índigo** (`#a3a8f5`, `#5a5fe8`,
  linhas `#d6d8f2`); o pacote determina **laranja** como decisão explícita do usuário.
- **Estado atual:** `design/tokens/tokens.css` = laranja (precedência declarada em `docs/brief/00-LEIA-PRIMEIRO.md`).
  O JSON de configuração ainda carrega as cores índigo e **não** foi alterado, para não inventar valores laranja
  não aprovados.
- **Ação:** confirmar a paleta. Se for laranja, remapear as cores de `brain-visual-config.json` e aprovar na revisão visual.

### D-002 — Repositório de destino do app

`COMANDO-INTEGRACAO-REACT.md` manda integrar em `hubexecutar-lgtm/react-router-starter-template`. Este repositório
(`sasexecutar-coder/blog`) hoje guarda assets, cena e pipeline. Definir: (a) o app nasce aqui, ou (b) este repositório
é a fonte do objeto e o app consome os assets no outro repositório.

### D-003 — Fonte da malha: fsaverage × sub-01 individual

Registrada em [`adr/ADR-001-malha-anatomica-do-cerebro.md`](adr/ADR-001-malha-anatomica-do-cerebro.md). Recomendação:
fsaverage (referência) como ponto de partida; o repositório já contém o GLB do `sub-01`. Pendente de confirmação.

## Divergências encontradas e tratadas

| Achado | Tratamento |
| --- | --- |
| `package-manifest.json` lista `02-assets/brain-points.bin`, mas o arquivo **não está** no ZIP | Substituído pelo `brain-particles.bin` do Archive (mesmo formato, 42.000 pontos, hash `c6822ba5…`, reproduzível pelo pipeline). `brain-point-cloud.ply` (derivado do `.bin` ausente) não foi importado. |
| Hash do `brain-poster.webp` no manifesto (`39973b39…`) ≠ arquivo no ZIP (`a9826f6f…`) | O `.webp` é o pôster legado (igual ao `brain-poster-legacy.webp` do Archive). Usado o `brain-poster.png` do Archive; o legado não foi importado. |
| Pacote diz "malha triangular ausente" e "download bloqueado" | Superado: o Archive traz os 5 insumos (hashes conferidos) e o GLB com 4 malhas triangulares. |
| `build-brain-assets.js` depende de globais do harness (`readFileBinary`, `saveFile`, `log`) | Criado `pipeline/build.mjs`; saída reproduz os hashes do `build-report.json`. |
| `reference/legacy-react/*` importa `@/data/home`, `@/lib/analytics/track`, `lucide-react` | Mantido só como referência de rotação, câmera e eventos. Não é compilável neste repositório. |
| Capturas de UI (`claude-codebase.png`, `claude-skills.png`) e `INPUT_INVENTORY.csv` | Não importados; permanecem no ZIP original. Mantida só a referência do globo. |
| A skill de design customizada citada no pacote | Não consta em nenhum dos dois ZIPs; não foi aplicada nem se afirma que foi. |
