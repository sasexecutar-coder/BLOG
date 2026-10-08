> **Errata (adicionada neste repositório):** os SHA-256 de `brain-particles.bin` (`1da8e10d…d431`) e
> `brain-particles-attr.bin` (`ceb2f0e3…03b3`) abaixo não correspondem aos arquivos entregues. Os valores reais são
> `c6822ba52404024b8c27565030ecffbd994d4cc5f561e7901e479a106354bdc9` e
> `6a64659f1b3419d5784388f840dae162d01a1a8b15ba3fb6d63e4f0ef67ec331`, confirmados por `build-report.json` e por
> `npm run assets:check`. O resto do documento é o original, sem alterações.

# Procedência — HOME-BRAIN-001

Caminho adotado: **A (anatomia original registrada)**. O candidato GLB de terceiro (caminho B) foi baixado só para conferência de hash (`ce761741…25e8`, confere com o manifesto legado) e **não é usado** em nenhum arquivo entregue.

## Insumos (baixados em 2026-10-06, SHA-256 conferido antes de qualquer leitura)

| Arquivo | Origem | Bytes | SHA-256 | Conteúdo validado |
| --- | --- | --- | --- | --- |
| lh.pial.T1 | s3.amazonaws.com/openneuro.org/ds006128/derivatives/FreeSurfer/sub-01/surf/ | 5.518.077 | 2aac780d…09f8 | superfície triangular FreeSurfer, 153.253 vértices / 306.502 faces |
| rh.pial.T1 | idem | 5.493.057 | 65569035…3d31 | 152.558 vértices / 305.112 faces |
| lh.sulc | idem | 613.027 | 0aad26d4…d9ac | 1 valor por vértice (contagem confere com lh.pial) |
| rh.sulc | idem | 610.247 | cb83fcb0…8e83 | idem rh |
| aseg.mgz | …/sub-01/mri/ | 440.891 | d2c386e1…1a96 | MGH 256³, int32, voxel 0,9 mm |

Dataset: OpenNeuro **ds006128**, sub-01, snapshot **1.0.11** (DOI 10.18112/openneuro.ds006128.v1.0.11; commit da tag 20faeed0c774665f58d55c409992f32c8dc4b76a conforme a procedência pública do candidato B). Licença **CC0-1.0**. Cópias verificadas em `source/`.

## Transformações (gerador `build/build-brain-assets.js`, determinístico)

1. Córtex: superfícies pial em RAS de superfície (TKR, mm). Simplificação por agrupamento de vértices em grade de 1,35 mm por hemisfério (posição e sulc = média do grupo; faces degeneradas e duplicadas removidas). Sem remalhamento arbitrário.
2. Cerebelo (rótulos aseg 7, 8, 46, 47) e tronco (16): máscara binária → 2× desfoque 3×3×3 → isossuperfície 0,5 por *surface nets* → suavização Taubin (6 iterações, λ 0,5 / μ −0,53). Voxel → TKR por `M = Mdc·diag(voxel)`, `P0 = −M·(dim/2)`; mesmo espaço das superfícies pial.
3. Eixos de cena: `x = Anterior, y = Superior, z = Direita` (permutação cíclica, det +1, mesma convenção do renderizador anterior).
4. Uma única normalização para todas as estruturas e partículas: centro da caixa conjunta `[−9,38; 24,77; 0,49] mm` subtraído; escala uniforme `0,021946 un./mm` (maior extensão = 3,8 un.; 1 un. = 45,57 mm). Extensão: 173,2 × 128,9 × 131,1 mm.
5. Orientação de faces verificada por volume assinado: córtex mantido, cerebelo/tronco invertidos para normais externas.

## Saídas

| Arquivo | Conteúdo | Bytes | SHA-256 |
| --- | --- | --- | --- |
| assets/brain-surface.glb | glTF 2.0; 4 malhas TRIANGLES (cortex-left 61.185 v / 132.887 tri; cortex-right 60.739 / 132.217; cerebellum 33.369 / 66.736; brain-stem 9.200 / 18.396; total 350.236 tri); atributos POSITION, NORMAL, COLOR_0 (cinza por sulco, já assado), _SULC; materiais brain-cortex, brain-subcortical | 9.471.892 | ce97da58…0c93 |
| assets/brain-particles.bin | 42.000 pontos int16 LE xyz, `valor/32767·2` (mesmo encoding do manifesto v1.1.0); 36.000 córtex (área × (1 − 0,7·profundidade)), 5.000 cerebelo, 1.000 tronco; deslocados 0,012 un. ao longo da normal; semente 41005 | 252.000 | 1da8e10d…d431 |
| assets/brain-particles-attr.bin | 2 × uint8 por ponto: profundidade sulcal 0 (giro)…255 (fundo), estrutura 0/1/2 | 84.000 | ceb2f0e3…03b3 |
| assets/brain-poster.png | render 1600×1200 da composição padrão | — | — |

Hashes completos e parâmetros: `assets/build-report.json`.

As partículas foram **regeneradas** sobre a malha entregue para garantir a mesma transformação. O `brain-points.bin` legado (hash ddbfaf80…) usa normalização própria não documentada e não foi combinado com a superfície.

## Verificação do GLB

Reaberto a partir dos bytes (parser independente em `brain-scene.js → inspectGlb`), tanto o canônico quanto o reexportado pela cena via GLTFExporter r184: 4 malhas, 4 primitivas, todas `TRIANGLES`, 350.236 triângulos, nomes preservados. Botão “Reabrir e verificar GLB” no painel repete a checagem.

## Limites

- Cerebelo e tronco vêm da segmentação volumétrica (resolução 0,9 mm): forma correta, sem folhas cerebelares.
- Nenhuma função executiva é inferida desses arquivos; marcadores continuam conceituais.
