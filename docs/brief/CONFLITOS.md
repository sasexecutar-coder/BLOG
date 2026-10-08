# Conflitos resolvidos no pacote de entrada

| Fonte recebida | Achado | Decisão |
| --- | --- | --- |
| HOME_BRAIN_FULLSTACK_v1.0.0 | 24.000 pontos; 288.000 bytes; pipeline do GLB de terceiro, diferente da versão seguinte | Arquivo antigo não ativado; origem conservada no inventário e no Brain .zip original |
| CEREBRO-3D-HANDOFF-001 e matriz | 42.000 pontos; 252.000 bytes; int16 little-endian | Única versão ativa do asset pontilhado, hash verificado |
| Dois manifestos v1.0.0/v1.1.0 | Encodings e hashes diferentes para o mesmo nome brain-points.bin | Manter manifesto v1.1.0 junto ao asset de 42.000 pontos |
| HOME_BRAIN_MOBILE_FIX_v1.0.1 | Patch contra commit antigo; contém CSS home anterior | Não transportar patch como instrução de implantação atual |
| Matriz Cloudflare | Cores/medidas estimadas, incluindo laranja #F56327 | Precedência dos tokens explícitos mais recentes: marca #F56A1C, pontos #F3A06B |
| Adr-frd-PRD.md | Transcrição de conversa com propostas de épocas diferentes, links sandbox e premissas superadas | Substituída como comando pela especificação atual; original preservado no arquivo recebido |
| Código e PLY | Nuvem de pontos sem superfície | Não satisfaz aceite de volume por si só; falta malha com faces |
| Captura Claude Design | Skill 3D object declara exportação OBJ/GLB | Requisito de export confirmado na UI; validar conteúdo do arquivo exportado |

50 arquivos internos/itens recebidos foram inventariados em `INPUT_INVENTORY.csv`. Arquivos legados continuam preservados em `Brain .zip`; este novo pacote contém somente a seleção ativa. Não há ZIPs aninhados nem `apply.patch` ativo.
