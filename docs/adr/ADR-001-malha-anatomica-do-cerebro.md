# ADR-001 — Malha anatômica 3D do cérebro e direção visual

- **Status:** Aceita quanto à direção visual · fonte da malha (fsaverage × individual) **pendente de confirmação**
- **Data:** 2026-10-07
- **Escopo:** HOME-BRAIN-001 (Home e `/mapas/`)
- **Relacionada a:** `docs/DECISIONS.md` (D-003), `docs/brief/BRIEF.md`, `docs/brief/SURFACE.md`

## Contexto

O mapa precisa de uma malha anatômica 3D com sulcos, giros e volume, que gire e receba marcadores, como na imagem de
referência. O OpenNeuro oferece dados de neuroimagem, incluindo ressonâncias. Para chegar a um objeto 3D é preciso
reconstruir a superfície cerebral e convertê-la para uso na web.

## Decisão

**Direção visual (definida):** superfície sólida como base; iluminação para revelar os sulcos; partículas como camada
complementar; marcadores sobre a anatomia. O artefato final é um GLB do cérebro.

**Fonte da malha (recomendação):** começar pela superfície **pial do FreeSurfer/fsaverage**, com hemisférios esquerdo e
direito disponíveis via Nilearn. É uma superfície cortical média de referência, **não** o cérebro de uma pessoa
específica. O FreeSurfer reconstrói a pial seguindo o limite externo do córtex na ressonância.

## Alternativas

| Caminho | Resultado | Observação |
| --- | --- | --- |
| fsaverage → GLB | Modelo cortical de referência para o mapa interativo | **Recomendado** como ponto de partida |
| OpenNeuro T1w → FreeSurfer → GLB | Modelo reconstruído de uma ressonância individual | Mais trabalho; representa um indivíduo |

## Consequências

- A malha de referência evita que o objeto seja lido como o cérebro de uma pessoa específica, o que combina com marcadores
  conceituais (o BRIEF proíbe atribuir funções executivas a uma região isolada).
- Superfície sólida que oclui o verso e pontos acima dela evitam o acúmulo de pontos frente/costas (BRIEF).
- A procedência (fonte, versão, licença, hash, transformações) continua obrigatória em `docs/provenance/`.

## Estado do repositório no momento deste registro

Esta ADR diverge do que o repositório já contém, e a divergência fica registrada em vez de resolvida em silêncio:

- Já existe `apps/blog/public/models/home-brain/brain-surface.glb` (4 malhas triangulares, 350.236 triângulos), gerado pelo caminho
  **individual**: OpenNeuro ds006128 `sub-01` → FreeSurfer (`lh/rh.pial.T1`) → GLB, com cerebelo e tronco extraídos de
  `aseg.mgz`. Isso é o segundo caminho da tabela, não o fsaverage.
- A ADR fala em `brain.glb` "ainda não baixado nem convertido": para o **fsaverage** isso é verdade; nenhum arquivo
  fsaverage foi obtido. O nome em uso hoje é `brain-surface.glb`.
- O fsaverage cobre apenas o córtex. Cerebelo e tronco, que o BRIEF inclui no objetivo visual, teriam de continuar
  vindo do `aseg.mgz` do `sub-01` (anatomias de origens diferentes, com registro de transformação) ou ficar de fora.

## Pendências para fechar o ADR

1. Confirmar: fsaverage substitui o `sub-01` no córtex, ou o `sub-01` permanece e o fsaverage é comparação?
2. Escolher a densidade do fsaverage (Nilearn oferece resoluções diferentes) conforme o orçamento de bytes e triângulos.
3. Verificar e registrar a licença e a versão do fsaverage usado; **não verificadas** neste registro (o CC0 documentado
   vale para o ds006128, não para o fsaverage).
4. Decidir o nome final do artefato (`brain.glb` ou `brain-surface.glb`) e, se houver troca, regenerar hashes e `ACEITE`.

## Evidência de insumos (caminho individual)

O `source.zip` recebido em 2026-10-07 contém os cinco arquivos originais do caminho **OpenNeuro T1w → FreeSurfer → GLB**
(ds006128 `sub-01`, snapshot 1.0.11, CC0-1.0). São **byte a byte idênticos** aos já versionados em `apps/blog/pipeline/source/`
(comparados com `cmp`), então não foram duplicados no repositório.

| Arquivo | Papel | Bytes | SHA-256 |
| --- | --- | ---: | --- |
| `lh.pial.T1` | superfície pial esquerda (153.253 vértices · 306.502 faces) | 5.518.077 | `2aac780d…bf09f8` |
| `rh.pial.T1` | superfície pial direita (152.558 vértices · 305.112 faces) | 5.493.057 | `65569035…ce3d31` |
| `lh.sulc` | profundidade sulcal esquerda | 613.027 | `0aad26d4…d5a9ac` |
| `rh.sulc` | profundidade sulcal direita | 610.247 | `cb83fcb0…c68e83` |
| `aseg.mgz` | segmentação (cerebelo e tronco) | 440.891 | `d2c386e1…41a96` |

Estes insumos sustentam o segundo caminho da tabela de alternativas. **Nenhum arquivo fsaverage foi fornecido ou obtido**;
a pendência 1 (fsaverage × `sub-01`) continua aberta.
