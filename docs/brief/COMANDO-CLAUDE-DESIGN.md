# Comando para colar no Claude Design

Ative a skill **3D object** e desenvolva o objeto `HOME-BRAIN-001` para Risco Cognitivo. Leia `00-LEIA-PRIMEIRO.md`, `01-design/BRIEF.md`, `tokens.css`, o manifesto do asset, `SURFACE.md` e `ACEITE.md`. Aplique também a skill de design customizada caso esteja anexada; não afirme tê-la aplicado se estiver ausente.

Use a anatomia existente como base. O `.bin` e o `.ply` disponíveis contêm 42 mil pontos, sem faces. Primeiro obtenha a malha cerebral pelas fontes documentadas e valide sua procedência. Se isso falhar, registre a falta do asset e prepare o restante da cena, sem apresentar uma nuvem de pontos como entrega volumétrica concluída.

Produza uma composição inspirada no globo Cloudflare: fundo branco, superfície cerebral branco/cinza suave com sulcos legíveis, pontos laranja sobre a superfície, linhas discretas e oclusão que separe frente e costas. Preserve os tokens explícitos do pacote; não recupere a identidade antiga do blog.

Crie controles visuais para superfície, partículas, linhas, opacidade, iluminação, câmera e velocidade. Inclua rotação, arraste, pausa e movimento reduzido. Permita comparar superfície, pontos e composição combinada. Marcadores são didáticos; não atribua funções executivas a uma região isolada.

Entregue prévia interativa e arquivos separados: `brain-surface.glb` com malhas triangulares, materiais, partículas/dados, código Three.js, configuração visual JSON, pôster e procedência. Reabra o GLB exportado e comprove que contém faces. Registre shaders e interações que dependem do código e não são transportados pelo GLB. Prepare o handoff para React após aprovação visual. Não execute deploy nesta etapa.
