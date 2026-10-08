# Obter a superfície que falta

## Caminho A — anatomia original registrada

Execute `python3 fetch_openneuro.py` neste diretório com Python 3.8+ e acesso à rede. Os cinco insumos e hashes estão em `manifest.json`. O script publica cada arquivo em `source/` somente após conferir SHA-256.

`lh.pial.T1` e `rh.pial.T1` são superfícies triangulares FreeSurfer. `lh.sulc` e `rh.sulc` são valores por vértice, não malhas. `aseg.mgz` contém segmentação volumétrica: cerebelo e tronco exigem extração de isosuperfícies, no sistema de coordenadas compatível. Converter córtex e estruturas para uma cena normalizada, manter registro de transformação e exportar GLB. Não inferir funções executivas a partir desses arquivos.

## Caminho B — candidato GLB já derivado, a verificar

O pacote legado aponta para um arquivo processado por terceiro:

- https://github.com/StarKnightt/brain-explorer/blob/master/public/models/brain-atlas.glb
- Download: https://raw.githubusercontent.com/StarKnightt/brain-explorer/master/public/models/brain-atlas.glb
- Procedência: https://github.com/StarKnightt/brain-explorer/blob/master/public/models/brain-atlas.provenance.json
- Avisos: https://github.com/StarKnightt/brain-explorer/blob/master/THIRD_PARTY_NOTICES.md

O manifesto legado registra SHA-256 esperado `ce761741d866e32d7a5b7638f4cacd5ec03e2b582e72c8218aba483ac28125e8`. Isso não foi revalidado contra o binário neste pacote. `master` é mutável: resolver e registrar commit fixo, conferir licença/procedência atual e validar o hash antes de afirmar equivalência. Se divergir, documentar a versão encontrada; não chamá-la de arquivo original OpenNeuro nem ocultar a divergência.

Este candidato é uma possibilidade de reaproveitamento de malha, não um arquivo presente no ZIP nem uma geometria já aprovada. Se não houver acesso, interromper somente a conclusão do asset 3D; não fabricar uma malha e apresentá-la como anatomia verificada.

## Registro exigido

Arquivo, fonte, commit/snapshot, licença, SHA-256, coordenadas, unidades, transformações, nomes de malhas, vértices, triângulos, materiais, tamanho de download e alterações feitas. O GLB final deve abrir sem depender do aplicativo que o criou.
