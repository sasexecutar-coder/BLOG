# Cérebro para Claude Design — pacote de entrada

ID: HOME-BRAIN-001  
PACKAGE_ID: CLAUDE-DESIGN-BRAIN-001  
VERSION: 2.0.0  
AREA: Risco Cognitivo / objeto 3D / Home e Mapa  
WORKFLOW: Inspecionar → obter superfície → compor camadas → revisar visual → exportar → integrar  
OWNER: A DEFINIR  
STATUS: PREPARED; malha triangular ainda ausente  
DEPENDS_ON: obtenção e validação de malha cerebral com faces  
BLOCKS: aprovação do cérebro volumétrico e implantação dessa versão  
AUTOMATION_LEVEL: A1 (preparação de pacote e comandos)

## Configurar o projeto que aparece na captura

1. Template: **Blank** para explorar o objeto isolado.
2. Skill: **3D object** — a captura enviada descreve “three.js model, downloadable as OBJ or GLB”.
3. Codebase: **None** nesta primeira etapa. Isso é uma recomendação de escopo para evitar incorporar os estilos antigos enquanto você aprova o objeto.
4. Design system: selecionar o novo sistema Risco Cognitivo inspirado na Cloudflare, se já cadastrado. Se aparecer None, anexar `01-design/tokens.css` e `01-design/BRIEF.md` e exigir esses valores antes de renderizar. Não selecionar outro sistema por conveniência.
5. Anexar este pacote. Caso a interface não aceite ZIP, extrair e anexar os arquivos de `01-design`, `02-assets`, `04-source-acquisition` e `05-evidence/cloudflare-globe-reference.png`, além deste README e do comando.
6. Colar o conteúdo de `COMANDO-CLAUDE-DESIGN.md`.

## Ordem de leitura

`00-LEIA-PRIMEIRO.md` → `01-design/BRIEF.md` → `01-design/tokens.css` → `02-assets/manifest.json` → `04-source-acquisition/SURFACE.md` → `ACEITE.md`.

`03-reference-code` é referência de rotação, câmera e eventos. Possui dependências do blog original; não é um aplicativo standalone, não deve restaurar a identidade anterior nem ser aplicado como patch.

## O que está presente e o que falta

| Insumo | Estado |
| --- | --- |
| `brain-points.bin` | Presente: 42.000 pontos em int16 little-endian; hash verificado |
| `brain-point-cloud.ply` | Presente: mesmos pontos em PLY; nenhum polígono |
| Pôster e renderizador | Presentes: referência do estado atual |
| Tokens explícitos do usuário | Presentes: substituem as estimativas anteriores |
| Superfícies FreeSurfer | Ausentes: URLs e baixador com verificação incluídos |
| Cérebro GLB com faces | Ausente: precisa ser obtido/construído antes do aceite visual final |
| Skill customizada que o usuário pretende enviar | Não localizada no ZIP recebido; a skill nativa 3D object está documentada pela captura |

## Precedência

1. Decisão explícita: cérebro com volume legível + pontos + linhas sutis, inspirado no globo, reutilizado na Home e em `/mapas/`.
2. Tokens explícitos do usuário: laranja de marca `#F56A1C`; pontos `#F3A06B`; neutros e tipografia em `tokens.css`.
3. Skill customizada quando fornecida: técnica compatível com as decisões acima; conflito precisa ser registrado, não resolvido silenciosamente.
4. Imagem Cloudflare: referência de composição, sem alegar extração de CSS oficial.
5. Código anterior: referência técnica, não aprovação visual.

## Limite desta entrega

Este pacote organiza os insumos e os comandos. Não inclui malha nova nem declara o cérebro volumétrico concluído. A tentativa de download das superfícies pela URL registrada falhou por indisponibilidade da conexão de rede neste ambiente. O baixador deve rodar onde houver acesso a essa origem. O site e o repositório não foram alterados.
