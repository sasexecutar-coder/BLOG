# Aceite — HOME-BRAIN-001

## G1 — geometria

- [ ] Asset de entrada com origem e licença registradas, hash conferido.
- [ ] Superfície real com triângulos, sulcos reconhecíveis e geometria íntegra.
- [ ] Modo superfície permanece reconhecível com pontos desligados.
- [ ] GLB exportado reaberto em uma cena limpa e inspecionado; listar primitivas TRIANGLES, nomes e contagens.
- [ ] Transformação consistente de hemisférios, cerebelo, tronco e partículas; nenhuma sobreposição oriunda de normalizações distintas.

## G2 — visual

- [ ] Comparar vistas lateral e 3/4 com a referência, em fundo branco.
- [ ] Cinza claro sustenta o volume, pontos laranja complementam, sulcos permanecem legíveis.
- [ ] Camada frontal e posterior não se confundem; transparência e depth test revisados.
- [ ] Controles permitem revisar superfície, pontos, luz e câmera sem editar código.
- [ ] Configuração escolhida exportada em JSON, com unidades e valores.

## G3 — interação e desempenho

- [ ] Arraste, pausa e reset; arraste horizontal não impede rolagem vertical no mobile.
- [ ] Movimento reduzido começa parado; controles textuais por teclado.
- [ ] Testar larguras 375, 768 e 1440, sem corte do cérebro nem overflow horizontal.
- [ ] Registrar navegador/dispositivo, bytes, triângulos e FPS observado; não inventar medições.
- [ ] Seleção em HTML acessível; ausência de WebGL preserva pôster e conteúdo.

## G4 — entrega para React

- [ ] `brain-surface.glb`, `brain-particles` com encoding documentado e `brain-visual-config.json`.
- [ ] Código da cena, materiais/shaders que não possam viajar no GLB e gerador/exportador correspondente.
- [ ] Pôster PNG/WebP e procedência.
- [ ] Handoff com importação, eventos, cleanup GPU e modos Home/Mapa.
- [ ] Aprovação visual explícita antes da integração no produto publicado.
