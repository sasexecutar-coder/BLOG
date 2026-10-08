// E2E do mapa do cérebro. Requer Playwright + Chromium e o app servido (npm run build && vite preview --port 4180).
//   PLAYWRIGHT_PATH=/caminho/para/playwright CHROMIUM_PATH=/caminho/chromium BASE=http://127.0.0.1:4180 node tests/e2e/suite.cjs <pasta-de-capturas>
// WebGL por software (SwiftShader): valida comportamento e números geométricos, NÃO desempenho (~1 quadro/s).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:4180';
const ARGS = ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
const out = process.argv[2];
const results = [];
const rec = (name, ok, info) => { results.push({ name, ok, info }); console.log((ok ? 'PASS' : 'FAIL'), name, info ?? ''); };
async function open(b, w, h, qs, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: opts.dpr ?? 1, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message.slice(0, 200)));
  p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) errs.push(m.text().slice(0, 200)); });
  await p.goto(`${BASE}/${qs}`, { waitUntil: 'load' });
  p._errs = errs; p._ctx = ctx; return p;
}
const ready = (p) => p.waitForSelector('.brain-stage[data-ready="1"]', { timeout: 90000 }).then(() => p.waitForTimeout(1200));
(async () => {
  const b = await chromium.launch({ ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}), args: ARGS });

  // 1) larguras e overflow
  for (const w of [375, 393, 768, 1440]) {
    const p = await open(b, w, w >= 768 ? 900 : 852, '?debug=1&freeze=1&angle=lateral');
    await ready(p);
    const d = await p.evaluate(() => window.__brain);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    rec(`largura ${w}px: sem overflow horizontal`, ov <= 0, `overflow ${ov}`);
    if (w <= 393) rec(`largura ${w}px: cérebro ≥ 75% da tela (lateral)`, d.widthPct >= 75, `${d.widthPct}%`);
    else console.log(`  info ${w}px: cérebro ${d.widthPct}% da tela, palco ${d.size.map(Math.round)}`);
    rec(`largura ${w}px: sem erros de console`, p._errs.length === 0, p._errs.join(' | '));
    await p.screenshot({ path: `${out}/s-${w}.png`, fullPage: true });
    await p._ctx.close();
  }

  // 2) marcadores visíveis a cada 30°
  const counts = [];
  for (let a = 0; a < 360; a += 30) {
    const p = await open(b, 393, 852, `?debug=1&freeze=1&angle=${a}`);
    await ready(p);
    const d = await p.evaluate(() => window.__brain);
    counts.push([a, d.visibleMarkers]);
    await p._ctx.close();
  }
  console.log('  contagem por ângulo:', counts.map(([a, c]) => `${a}°=${c}`).join(' '));
  rec('≥ 2 marcadores visíveis a cada 30° (360°)', counts.every(([, c]) => c >= 2), `mín ${Math.min(...counts.map(c => c[1]))}`);

  // 3) seleção, textos exatos, Esc, rede, teclado
  const EXACT = { 'Planejamento': 'Define metas, organiza passos e prioriza ações.', 'Controle inibitório': 'Ajuda a focar e evitar distrações.', 'Memória de trabalho': 'Mantém e manipula informações no curto prazo.', 'Flexibilidade': 'Permite adaptar estratégias e lidar com mudanças.' };
  {
    const p = await open(b, 393, 852, '?debug=1&freeze=1&angle=lateral'); await ready(p);
    for (const [label, text] of Object.entries(EXACT)) {
      await p.getByRole('button', { name: label, exact: true }).click();
      const t = await p.locator('.brain-callout__text').innerText();
      const h = await p.locator('.brain-callout__title').innerText();
      rec(`callout "${label}": texto exato`, t === text && h === label, t);
    }
    const pressed = await p.getByRole('button', { name: 'Flexibilidade', exact: true }).getAttribute('aria-pressed');
    rec('chip da função selecionada tem aria-pressed=true', pressed === 'true');
    await p.getByRole('button', { name: 'Destacar rede' }).click();
    rec('estado "rede destacada" alterna (aria-pressed)', (await p.getByRole('button', { name: 'Ocultar rede' }).getAttribute('aria-pressed')) === 'true');
    await p.waitForTimeout(800); await p.screenshot({ path: `${out}/s-rede.png` });
    await p.keyboard.press('Escape');
    rec('Esc fecha a seleção', (await p.locator('.brain-callout').getAttribute('data-callout')) === 'none');
    // marcador visível clicável
    const vis = p.locator('.brain-marker[data-visible="1"]').first();
    const n = await vis.count();
    if (n) { await vis.click({ force: true }); rec('clicar no marcador visível seleciona a função', (await p.locator('.brain-callout').getAttribute('data-callout')) !== 'none'); }
    const dbg = await p.evaluate(() => window.__brain);
    rec('interseção marcador × painel de texto = 0', dbg.markerTextIntersections === 0, String(dbg.markerTextIntersections));
    // todos os marcadores são <button aria-pressed>
    const tags = await p.$$eval('.brain-marker', els => els.map(e => [e.tagName, e.hasAttribute('aria-pressed')]));
    rec('4 marcadores são <button> com aria-pressed', tags.length === 4 && tags.every(([t, a]) => t === 'BUTTON' && a));
    await p._ctx.close();
  }

  // 4) painel de controles + contraste + URL + export/import
  {
    const p = await open(b, 393, 852, '?controls=1&debug=1&freeze=1&angle=lateral'); await ready(p);
    const before = await p.evaluate(() => window.__brain.contrast.marker);
    await p.locator('input[data-color="active"]').fill('#161826');   // ativo igual ao fundo
    await p.waitForTimeout(800);
    const after = await p.evaluate(() => window.__brain.contrast.marker);
    rec('mudar o hex "Ativo" atualiza o contraste ao vivo', after < 1.1 && before > 3, `${before} → ${after}`);
    const warn = await p.locator('li[data-check="marker"]').getAttribute('data-ok');
    rec('contraste < 3:1 é sinalizado', warn === 'false');
    rec('configuração vai para a URL (?cfg=)', /[?&]cfg=/.test(p.url()));
    await p.getByRole('button', { name: 'Exportar' }).click();
    const json = await p.getByLabel('JSON da configuração').inputValue();
    const parsed = JSON.parse(json);
    rec('exportar devolve JSON com o hex alterado', parsed.params.active === '#161826', parsed.params.active);
    await p.getByRole('button', { name: 'Restaurar preset' }).click(); await p.waitForTimeout(500);
    rec('restaurar volta ao preset', (await p.evaluate(() => window.__brain.contrast.marker)) > 3);
    await p.getByLabel('JSON da configuração').fill(json); await p.getByRole('button', { name: 'Aplicar' }).click(); await p.waitForTimeout(500);
    rec('importar reaplica o mesmo JSON', (await p.evaluate(() => window.__brain.contrast.marker)) < 1.1);
    // URL compartilhável: recarregar mantém
    const url = p.url(); await p._ctx.close();
    const p2 = await open(b, 393, 852, url.replace(BASE + '/', '') + '&debug=1'); await ready(p2);
    rec('recarregar a URL mantém a configuração', (await p2.evaluate(() => window.__brain.contrast.marker)) < 1.1);
    await p2._ctx.close();
  }

  // 5) presets: renderiza e captura
  for (const preset of ['nocturne-puro', 'cloudflare-claro']) {
    const p = await open(b, 393, 852, `?preset=${preset}&debug=1&freeze=1&angle=lateral`); await ready(p);
    const c = await p.evaluate(() => window.__brain.contrast);
    rec(`preset ${preset}: renderiza sem erro`, p._errs.length === 0, p._errs.join('|'));
    console.log(`  contrastes ${preset}:`, JSON.stringify(c));
    await p.screenshot({ path: `${out}/s-${preset}.png`, fullPage: false });
    await p._ctx.close();
  }

  // 6) sem WebGL e movimento reduzido
  {
    const p = await open(b, 393, 852, '?nowebgl=1');
    await p.waitForSelector('.brain-stage[data-fallback="1"]', { timeout: 20000 });
    const hasPoster = await p.locator('img.brain-stage__poster').count();
    await p.getByRole('button', { name: 'Marcador: Planejamento' }).click();
    const t = await p.locator('.brain-callout__text').innerText();
    rec('sem WebGL: pôster + marcadores em fila + painel funcionam', hasPoster === 1 && t === EXACT['Planejamento'], t);
    await p.screenshot({ path: `${out}/s-semwebgl.png`, fullPage: true }); await p._ctx.close();
    const r = await open(b, 393, 852, '?debug=1&angle=lateral', { reduced: true }); await ready(r);
    const a0 = await r.evaluate(() => window.__brain.rotYDeg); await r.waitForTimeout(3000);
    const a1 = await r.evaluate(() => window.__brain.rotYDeg);
    rec('movimento reduzido: não gira sozinho', a0 === a1, `${a0}° → ${a1}°`); await r._ctx.close();
    const m = await open(b, 393, 852, '?debug=1&angle=lateral'); await ready(m);
    const g0 = await m.evaluate(() => window.__brain.rotYDeg); await m.waitForTimeout(3500);
    const g1 = await m.evaluate(() => window.__brain.rotYDeg);
    rec('movimento normal: gira sozinho', g1 !== g0, `${g0}° → ${g1}°`); await m._ctx.close();
  }

  // 7) selecionar gira até o marcador ficar de frente
  {
    const p = await open(b, 393, 852, '?debug=1&angle=lateral', { reduced: true }); await ready(p);
    await p.getByRole('button', { name: 'Memória de trabalho', exact: true }).click(); await p.waitForTimeout(1500);
    const d = await p.evaluate(() => window.__brain);
    const el = await p.locator('.brain-marker[data-marker="memoria-de-trabalho"]').getAttribute('data-visible');
    rec('selecionar uma função gira até o marcador ficar visível', d.rotYDeg > 108 && d.rotYDeg < 112 && el === '1', `rotY ${d.rotYDeg}°, visível=${el}`);
    await p._ctx.close();
    const q = await open(b, 393, 852, '?debug=1&angle=lateral'); await ready(q);
    await q.getByRole('button', { name: 'Pausar' }).click();
    await q.getByRole('button', { name: 'Flexibilidade', exact: true }).click();
    await q.waitForFunction(() => Math.abs(window.__brain.rotYDeg - 200) < 1.5, null, { timeout: 40000, polling: 250 }).catch(() => {});
    const e = await q.evaluate(() => window.__brain);
    const v = await q.locator('.brain-marker[data-marker="flexibilidade"]').getAttribute('data-visible');
    rec('com animação: gira suavemente até o marcador (Flexibilidade)', Math.abs(e.rotYDeg - 200) < 1.5 && v === '1', `rotY ${e.rotYDeg}°, visível=${v}`);
    await q._ctx.close();
  }
  await b.close();
  const f = results.filter(r => !r.ok);
  console.log(`\nRESUMO: ${results.length - f.length}/${results.length} passaram`);
  if (f.length) { console.log('FALHAS:'); f.forEach(r => console.log(' -', r.name, r.info ?? '')); process.exit(1); }
})().catch(e => { console.error('FALHA GERAL', e.stack || e.message); process.exit(2); });
