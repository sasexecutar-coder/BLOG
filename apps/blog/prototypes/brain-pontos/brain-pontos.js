// HOME-BRAIN-001 · brain-pontos — rodada 1 (só a cena). three.js r184, sem framework.
// Base: brain-scene.js (parseGlb, VIEWS) e brain-hollow.js (contornos 13 latitudes × 9 meridianos).
// A malha nunca é pintada: serve de oclusor invisível e de casco para o aro.
import * as THREE from 'three';
import { parseGlb, VIEWS } from '../../app/brain/brain-scene.js';
import { createHollowBrain, HOLLOW_DEFAULTS } from '../../app/brain/brain-hollow.js';

const T0 = performance.now();
const qs = new URLSearchParams(location.search);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
export const PARAMS = {
  back: qs.get('back') === 'xray' ? 'xray' : 'occlude',
  theme: qs.get('theme') === 'claro' ? 'claro' : 'noite',
  angle: ['lateral', 'posterior', 'frontal'].includes(qs.get('angle')) ? qs.get('angle') : 'lateral',
  freeze: qs.get('freeze') === '1',
  debug: qs.get('debug') === '1',
  zoom: clamp(parseFloat(qs.get('zoom')) || 1, 0.5, 1.5),
};
export const CFG = {
  fovDeg: 30, lateralWidth: 0.78, stageHeight: 1.1, maxDpr: 3,
  dotPx: 2.1, depthFade: 0.45, xrayBackAlpha: 0.08,
  rimPx: 1.25, rimGlowPx: 5, insetPx: 0.6, peakFacing: [0.1, 0.65],
  blueNoise: { minDist: 0.036, seed: 41005, budgetMs: 300 }, maxDepth: 0.62,
  turnSec: 55, resumeMs: 3000, dragTurnsPerWidth: 0.5,
};
const ANGLES = { lateral: VIEWS['lateral-right'][1], posterior: VIEWS.posterior[1], frontal: VIEWS.frontal[1] };
const TILT = VIEWS['lateral-right'][0];
const ASSETS = new URL('../../public/models/home-brain/', import.meta.url).href;

// ── assets ──────────────────────────────────────────────────────────────────
async function bytes(f) { const r = await fetch(ASSETS + f); if (!r.ok) throw new Error(f + ': ' + r.status); return r.arrayBuffer(); }
async function particleBytes(f) { // .bin do repositório; senão a cópia base64 (LEIA-ME-bin.md)
  try { return await bytes(f); } catch (_) {
    const r = await fetch(ASSETS + f + '.b64.txt'); if (!r.ok) throw new Error(f + '(.b64.txt): ' + r.status);
    const bin = atob((await r.text()).replace(/\s+/g, '')), out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out.buffer;
  }
}
function accessor(g, i) {
  const a = g.json.accessors[i], v = g.json.bufferViews[a.bufferView];
  const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  return new C(g.bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * n);
}

// ── tokens (CSS → THREE.Color + alfa), sem cor literal no JS ───────────────
const probe = document.createElement('i'); probe.style.display = 'none';
function token(name) {
  if (!probe.isConnected) document.body.appendChild(probe);
  probe.style.color = `var(${name})`;
  const s = getComputedStyle(probe).color;
  let m = s.match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.e-]+%?))?\)/);
  let r, g, b, a = 1;
  if (m) { [r, g, b] = [+m[1], +m[2], +m[3]]; if (m[4]) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : +m[4]; }
  else if ((m = s.match(/rgba?\(([^)]+)\)/))) {
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(parseFloat); [r, g, b] = [p[0] / 255, p[1] / 255, p[2] / 255]; if (p.length > 3) a = p[3];
  } else throw new Error('token sem cor: ' + name + ' → ' + s);
  return { color: new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace), alpha: a };
}

// ── blue-noise: dart throwing sobre os 42 000 pontos do build, distância mínima, semente fixa ──
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function blueNoise(pos, cand, r, seed) {
  const order = Int32Array.from(cand), rnd = mulberry32(seed);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = order[i]; order[i] = order[j]; order[j] = t; }
  const grid = new Map(), r2 = r * r, inv = 1 / r, kept = [];
  const key = (x, y, z) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
  for (const i of order) {
    const x = pos[3 * i], y = pos[3 * i + 1], z = pos[3 * i + 2];
    const cx = Math.floor(x * inv), cy = Math.floor(y * inv), cz = Math.floor(z * inv);
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++) for (let dy = -1; dy <= 1 && ok; dy++) for (let dz = -1; dz <= 1 && ok; dz++) {
      const cell = grid.get(key(cx + dx, cy + dy, cz + dz)); if (!cell) continue;
      for (const j of cell) { const ex = pos[3 * j] - x, ey = pos[3 * j + 1] - y, ez = pos[3 * j + 2] - z; if (ex * ex + ey * ey + ez * ez < r2) { ok = false; break; } }
    }
    if (!ok) continue;
    kept.push(i); const k = key(cx, cy, cz); const c = grid.get(k); c ? c.push(i) : grid.set(k, [i]);
  }
  return kept;
}

// ── shaders: distância da câmera (uCam) e raio da esfera justa (uR) chegam a cada quadro ──
const DEPTH = `uniform float uCam; uniform float uR;
float backOf(vec4 mv) { return clamp((-mv.z - (uCam - uR)) / (2.0 * uR), 0.0, 1.0); }`;
const ALPHA = `uniform float uDepthFade; uniform float uXray; uniform float uBackA;
float depthAlpha(float a, float back) { a *= mix(1.0, 1.0 - uDepthFade, back);
  return mix(a, min(a, uBackA), smoothstep(0.45, 0.6, back) * uXray); }`;
const PT_VS = `${DEPTH}
attribute vec3 aNormal; uniform float uSize; uniform float uDpr; uniform vec2 uPeakFacing; varying float vPeak; varying float vBack;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vBack = backOf(mv);
  vPeak = smoothstep(uPeakFacing.x, uPeakFacing.y, dot(normalize(normalMatrix * aNormal), normalize(-mv.xyz)));
  gl_PointSize = uSize * uDpr * (uCam / -mv.z) * mix(0.85, 1.15, vPeak); gl_Position = projectionMatrix * mv; }`;
const PT_FS = `${ALPHA}
uniform vec3 uAmb; uniform float uAmbA; uniform vec3 uPeakC; uniform float uPeakA; varying float vPeak; varying float vBack;
void main() { float d = 1.0 - smoothstep(0.34, 0.5, length(gl_PointCoord - 0.5)); if (d < 0.01) discard;
  gl_FragColor = vec4(mix(uAmb, uPeakC, vPeak), depthAlpha(mix(uAmbA, uPeakA, vPeak) * d, vBack));
#include <colorspace_fragment>
}`;
const LN_VS = `${DEPTH}
varying float vBack; void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vBack = backOf(mv); gl_Position = projectionMatrix * mv; }`;
const LN_FS = `${ALPHA}
uniform vec3 uColor; uniform float uAlpha; varying float vBack;
void main() { gl_FragColor = vec4(uColor, depthAlpha(uAlpha, vBack));
#include <colorspace_fragment>
}`;
const HULL_VS = `uniform float uOffset; void main() { vec3 p = position + normalize(normal) * uOffset; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const MASK_FS = `void main() { gl_FragColor = vec4(1.0); }`;
const RIM_VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const RIM_FS = `uniform sampler2D uMask; uniform vec2 uTexel; uniform float uRimPx; uniform float uGlowPx;
uniform vec3 uRimC; uniform float uRimA; uniform vec3 uGlowC; uniform float uGlowA; varying vec2 vUv;
float ring(float r) { float m = 0.0; for (int i = 0; i < 12; i++) { float a = float(i) * 0.5235988; m = max(m, texture2D(uMask, vUv + vec2(cos(a), sin(a)) * uTexel * r).r); } return m; }
void main() { float m = texture2D(uMask, vUv).r; float o = 1.0 - smoothstep(0.0, 0.5, m); if (o < 0.01) discard;
  float rim = max(ring(uRimPx * 0.5), ring(uRimPx)) * o * uRimA;
  float glow = max(ring(uGlowPx * 0.5) * 0.7, ring(uGlowPx) * 0.35) * o * uGlowA;
  float a = rim + glow * (1.0 - rim); if (a < 0.003) discard;
  gl_FragColor = vec4((uRimC * rim + uGlowC * glow * (1.0 - rim)) / a, a);
#include <colorspace_fragment>
}`;

// ── cena ───────────────────────────────────────────────────────────────────
export async function mountBrain(stage, panel) {
  const timings = {};
  const [glb, pts, attr] = await Promise.all([bytes('brain-surface.glb'), particleBytes('brain-particles.bin'), particleBytes('brain-particles-attr.bin')]);
  if (pts.byteLength % 6 || attr.byteLength * 3 !== pts.byteLength) throw new Error('invalid particle assets');
  timings.fetch = performance.now() - T0;

  // Pontos do build: int16 xyz (/32767·2) + uint8 [profundidade sulcal, estrutura].
  const q = new Int16Array(pts), at = new Uint8Array(attr), n = q.length / 3;
  const all = new Float32Array(n * 3); for (let i = 0; i < 3 * n; i++) all[i] = (q[i] / 32767) * 2;
  const cand = []; for (let i = 0; i < n; i++) if (at[2 * i] / 255 <= CFG.maxDepth) cand.push(i); // fundo sulcal fica aberto (como brain-hollow)
  let t = performance.now();
  let kept = blueNoise(all, cand, CFG.blueNoise.minDist, CFG.blueNoise.seed);
  timings.blueNoise = performance.now() - t;
  const sampling = timings.blueNoise > CFG.blueNoise.budgetMs ? 'atual (blue-noise > 300 ms)' : 'blue-noise';
  if (timings.blueNoise > CFG.blueNoise.budgetMs) kept = cand;

  // Esfera justa: centroide dos pontos + maior distância a ele.
  const c = new THREE.Vector3();
  for (const i of kept) c.x += all[3 * i], c.y += all[3 * i + 1], c.z += all[3 * i + 2];
  c.divideScalar(kept.length);
  let R = 0; for (const i of kept) R = Math.max(R, Math.hypot(all[3 * i] - c.x, all[3 * i + 1] - c.y, all[3 * i + 2] - c.z));

  // Malha: oclusor invisível (profundidade) e máscara da silhueta (aro). Nunca pintada.
  const g = parseGlb(glb), geos = [];
  for (const m of g.json.meshes) {
    const pr = m.primitives[0], geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(accessor(g, pr.attributes.POSITION), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(accessor(g, pr.attributes.NORMAL), 3));
    geo.setIndex(new THREE.BufferAttribute(accessor(g, pr.indices), 1));
    geo.name = m.name; geos.push(geo);
  }
  // Normal de cada ponto = normal do vértice mais próximo da malha. O pico (100%) é o ponto voltado para a câmera;
  // a profundidade sulcal do build é quase binária (0 / 90 / 255) e não serve de gradação.
  t = performance.now();
  const inv = 1 / CFG.blueNoise.minDist, vgrid = new Map(), vkey = (x, y, z) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
  const vsrc = geos.map((geo) => [geo.attributes.position.array, geo.attributes.normal.array]);
  vsrc.forEach(([p], gi) => { for (let i = 0; i < p.length; i += 3) { const k = vkey(Math.floor(p[i] * inv), Math.floor(p[i + 1] * inv), Math.floor(p[i + 2] * inv)); const cell = vgrid.get(k); cell ? cell.push(gi, i) : vgrid.set(k, [gi, i]); } });
  const pos = new Float32Array(kept.length * 3), nrm = new Float32Array(kept.length * 3);
  kept.forEach((src, k) => {
    const x = all[3 * src], y = all[3 * src + 1], z = all[3 * src + 2]; pos[3 * k] = x; pos[3 * k + 1] = y; pos[3 * k + 2] = z;
    const cx = Math.floor(x * inv), cy = Math.floor(y * inv), cz = Math.floor(z * inv); let best = Infinity, bg = -1, bi = 0;
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
      const cell = vgrid.get(vkey(cx + dx, cy + dy, cz + dz)); if (!cell) continue;
      for (let e = 0; e < cell.length; e += 2) { const p = vsrc[cell[e]][0], i = cell[e + 1], ex = p[i] - x, ey = p[i + 1] - y, ez = p[i + 2] - z, d2 = ex * ex + ey * ey + ez * ez; if (d2 < best) { best = d2; bg = cell[e]; bi = i; } }
    }
    if (bg >= 0) nrm.set(vsrc[bg][1].subarray(bi, bi + 3), 3 * k);
    else { const l = Math.hypot(x - c.x, y - c.y, z - c.z) || 1; nrm[3 * k] = (x - c.x) / l; nrm[3 * k + 1] = (y - c.y) / l; nrm[3 * k + 2] = (z - c.z) / l; }
  });
  timings.normals = performance.now() - t;
  // Contornos: os de brain-hollow.js (13 latitudes, 9 meridianos, só a casca).
  t = performance.now();
  const hollow = createHollowBrain({ glb, pts, attr }, HOLLOW_DEFAULTS);
  timings.contours = performance.now() - t;
  const lgeo = hollow.lines.geometry; hollow.points.geometry.dispose(); hollow.points.material.dispose(); hollow.lines.material.dispose();

  const shared = { uCam: { value: 1 }, uR: { value: R }, uDepthFade: { value: CFG.depthFade }, uXray: { value: PARAMS.back === 'xray' ? 1 : 0 }, uBackA: { value: CFG.xrayBackAlpha } };
  const pu = { ...shared, uSize: { value: CFG.dotPx }, uDpr: { value: 1 }, uAmb: { value: new THREE.Color() }, uAmbA: { value: 0.12 }, uPeakC: { value: new THREE.Color() }, uPeakA: { value: 1 }, uPeakFacing: { value: new THREE.Vector2(...CFG.peakFacing) } };
  const lu = { ...shared, uColor: { value: new THREE.Color() }, uAlpha: { value: 0.2 } };
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pgeo.setAttribute('aNormal', new THREE.BufferAttribute(nrm, 3));
  const pmat = new THREE.ShaderMaterial({ name: 'brain-dots', uniforms: pu, vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false });
  const lmat = new THREE.ShaderMaterial({ name: 'brain-grid', uniforms: lu, vertexShader: LN_VS, fragmentShader: LN_FS, transparent: true, depthWrite: false });
  const points = new THREE.Points(pgeo, pmat), lines = new THREE.LineSegments(lgeo, lmat);
  const occU = { uOffset: { value: 0 } };
  const occMat = new THREE.ShaderMaterial({ name: 'brain-occluder', uniforms: occU, vertexShader: HULL_VS, fragmentShader: MASK_FS, colorWrite: false, depthWrite: true, side: THREE.DoubleSide });
  const maskMat = new THREE.ShaderMaterial({ name: 'brain-mask', uniforms: { uOffset: { value: 0 } }, vertexShader: HULL_VS, fragmentShader: MASK_FS, side: THREE.DoubleSide });
  const rimU = { uMask: { value: null }, uTexel: { value: new THREE.Vector2() }, uRimPx: { value: 1 }, uGlowPx: { value: 1 },
    uRimC: { value: new THREE.Color() }, uRimA: { value: 1 }, uGlowC: { value: new THREE.Color() }, uGlowA: { value: 1 } };
  const rimMat = new THREE.ShaderMaterial({ name: 'brain-rim', uniforms: rimU, vertexShader: RIM_VS, fragmentShader: RIM_FS, transparent: true, depthTest: false, depthWrite: false });
  const rimScene = new THREE.Scene(), rimCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  rimScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), rimMat));
  const content = new THREE.Group(); content.position.copy(c).negate();
  const xray = PARAMS.back === 'xray';
  // occlude: oclusor (só profundidade) → grade → pontos.  xray: sem oclusor no passe principal. Aro: passe de máscara (camada 1) + composição.
  for (const geo of geos) {
    const o = new THREE.Mesh(geo, occMat); o.renderOrder = 0; o.name = 'occluder-' + geo.name;
    o.layers.enable(1); if (xray) o.layers.disable(0);
    content.add(o);
  }
  lines.renderOrder = 1; points.renderOrder = 2; content.add(lines, points);
  const pivot = new THREE.Group(); pivot.add(content);
  const scene = new THREE.Scene(); scene.add(pivot);
  const maskRT = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true }), maskScale = Math.min(window.devicePixelRatio || 1, 2), black = new THREE.Color(0, 0, 0);
  rimU.uMask.value = maskRT.texture;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  const dpr = Math.min(window.devicePixelRatio || 1, CFG.maxDpr);
  renderer.setPixelRatio(dpr); pu.uDpr.value = dpr;
  const canvas = renderer.domElement; canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);
  const camera = new THREE.PerspectiveCamera(CFG.fovDeg, 1, 0.01, 100);

  // Tema por tokens.
  const clearColor = new THREE.Color();
  function applyTheme() {
    const bg = token('--brain-bg'), amb = token('--brain-dot-ambient'), pk = token('--brain-dot-peak');
    const rim = token('--brain-rim'), glow = token('--brain-rim-glow'), grid = token('--brain-grid');
    clearColor.copy(bg.color); renderer.setClearColor(clearColor, 1);
    pu.uAmb.value.copy(amb.color); pu.uAmbA.value = amb.alpha; pu.uPeakC.value.copy(pk.color); pu.uPeakA.value = pk.alpha;
    lu.uColor.value.copy(grid.color); lu.uAlpha.value = grid.alpha;
    rimU.uRimC.value.copy(rim.color); rimU.uRimA.value = rim.alpha; rimU.uGlowC.value.copy(glow.color); rimU.uGlowA.value = glow.alpha;
    const blend = PARAMS.theme === 'claro' ? THREE.NormalBlending : THREE.AdditiveBlending;
    for (const m of [pmat, lmat]) { m.blending = blend; m.needsUpdate = true; }
    return { bg, amb, pk, rim, grid };
  }
  const theme = applyTheme();

  // Enquadramento: k = fração da largura ocupada pelo diâmetro da esfera justa; resolvido para que a
  // vista lateral (com perspectiva) dê CFG.lateralWidth. Independe do aspecto do palco.
  const v = new THREE.Vector3(), tanV = Math.tan(THREE.MathUtils.degToRad(CFG.fovDeg / 2));
  const distFor = (k, aspect) => R / Math.sin(Math.atan(k * tanV * aspect));
  function projectedWidth() { // fração da largura do canvas ocupada pelos pontos (todos, incluindo os ocultos)
    pivot.updateMatrixWorld(true); camera.updateMatrixWorld(true);
    const mw = points.matrixWorld; let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < pos.length; i += 3) { v.set(pos[i], pos[i + 1], pos[i + 2]).applyMatrix4(mw).project(camera); if (v.x < lo) lo = v.x; if (v.x > hi) hi = v.x; }
    return (hi - lo) / 2;
  }
  let K = 0.9;
  { const rotY = pivot.rotation.y; pivot.rotation.set(TILT, ANGLES.lateral, 0); camera.aspect = 1;
    for (let it = 0; it < 4; it++) { camera.position.set(0, 0, distFor(K, 1)); camera.lookAt(0, 0, 0); camera.near = 0.01; camera.updateProjectionMatrix(); K *= CFG.lateralWidth / projectedWidth(); }
    pivot.rotation.y = rotY; }
  const kEff = K * PARAMS.zoom;

  let W = 1, H = 1, dist = 1, worldPerPx = 0, dirty = true;
  function fit() {
    const w = stage.clientWidth || 1; if (w === W && H > 1) return; W = w; H = Math.round(CFG.stageHeight * kEff * W);
    renderer.setSize(W, H, false); canvas.style.width = '100%'; canvas.style.height = '100%';
    camera.aspect = W / H; dist = distFor(kEff, camera.aspect);
    camera.position.set(0, 0, dist); camera.lookAt(0, 0, 0);
    camera.near = Math.max(0.01, dist - R * 1.3); camera.far = dist + R * 1.3; camera.updateProjectionMatrix();
    maskRT.setSize(Math.round(W * maskScale), Math.round(H * maskScale)); rimU.uTexel.value.set(1 / (W * maskScale), 1 / (H * maskScale));
    dirty = true; rimU.uRimPx.value = CFG.rimPx * maskScale; rimU.uGlowPx.value = CFG.rimGlowPx * maskScale;
  }
  stage.style.aspectRatio = `1 / ${(CFG.stageHeight * kEff).toFixed(4)}`; // altura do palco = 1.1 × diâmetro da esfera
  fit(); let fitRaf = 0; new ResizeObserver(() => { cancelAnimationFrame(fitRaf); fitRaf = requestAnimationFrame(fit); }).observe(stage);

  // Rotação só em y: automática (1 volta / 55 s), arrasto horizontal, retoma 3 s depois de soltar.
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let rotY = ANGLES[PARAMS.angle], drag = null, released = -Infinity;
  canvas.style.touchAction = 'pan-y';
  if (!PARAMS.freeze) {
    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', (e) => { drag = { id: e.pointerId, x: e.clientX }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
    canvas.addEventListener('pointermove', (e) => { if (!drag || e.pointerId !== drag.id) return; rotY += ((e.clientX - drag.x) / W) * CFG.dragTurnsPerWidth * Math.PI * 2; drag.x = e.clientX; });
    const end = (e) => { if (!drag || e.pointerId !== drag.id) return; drag = null; released = performance.now(); canvas.style.cursor = 'grab'; };
    canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end); canvas.addEventListener('lostpointercapture', end);
  }

  let visible = true; new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(stage);
  const dbg = { theme: PARAMS.theme, angle: PARAMS.angle, back: PARAMS.back, zoom: PARAMS.zoom, sampling, sourcePoints: n, points: kept.length,
    contourSegments: lgeo.attributes.position.count / 2, R: +R.toFixed(4), k: +kEff.toFixed(4), dpr, dotPx: CFG.dotPx, timings };
  window.__brainDebug = dbg;
  if (PARAMS.debug) window.__snap = () => { const i = new Image(); i.src = canvas.toDataURL(); i.style.cssText = 'display:block;width:100%;height:100%'; canvas.style.display = 'none'; stage.appendChild(i); };
  if (PARAMS.debug) window.__brain = { points, lines, content, pu, lu, rimU, renderer };
  let last = performance.now(), frame = 0, first = true;
  renderer.setAnimationLoop((now) => {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (!visible && !first && !dirty) return; dirty = false;
    const auto = !PARAMS.freeze && !reduced.matches && !drag && now - released > CFG.resumeMs;
    if (auto) rotY += dt * (Math.PI * 2) / CFG.turnSec;
    pivot.rotation.set(TILT, rotY, 0);
    // Distância câmera→alvo por quadro (sem constantes 6.6).
    const camDist = camera.position.length();
    shared.uCam.value = camDist;
    worldPerPx = (2 * camDist * tanV) / H;
    occU.uOffset.value = -CFG.insetPx * worldPerPx;
    // Máscara da silhueta → aro fino + halo, só fora da silhueta.
    renderer.setRenderTarget(maskRT); renderer.setClearColor(black, 1); renderer.clear();
    scene.overrideMaterial = maskMat; camera.layers.set(1); renderer.render(scene, camera);
    scene.overrideMaterial = null; camera.layers.set(0); renderer.setRenderTarget(null); renderer.setClearColor(clearColor, 1);
    renderer.render(scene, camera);
    renderer.autoClear = false; renderer.render(rimScene, rimCam); renderer.autoClear = true;
    if (first) { first = false; timings.init = performance.now() - T0; stage.dataset.ready = '1'; }
    if (PARAMS.debug && frame++ % 12 === 0) {
      dbg.widthPct = +(projectedWidth() * 100 * (W / window.innerWidth)).toFixed(1);
      dbg.stage = [W, H]; dbg.camDist = +camDist.toFixed(3); dbg.rotYDeg = +((THREE.MathUtils.radToDeg(rotY) % 360 + 360) % 360).toFixed(1);
      if (panel) renderPanel(panel, dbg);
    }
  });
  return dbg;
}

const fmt = (x, d = 0) => Number(x).toLocaleString('pt-BR', { minimumFractionDigits: d, maximumFractionDigits: d });
function renderPanel(el, d) {
  const rows = [
    ['Largura do cérebro', `${fmt(d.widthPct, 1)} % da tela`],
    ['Inicialização', `${fmt(d.timings.init)} ms`],
    ['  rede · blue-noise · normais · contornos', `${fmt(d.timings.fetch)} · ${fmt(d.timings.blueNoise)} · ${fmt(d.timings.normals)} · ${fmt(d.timings.contours)} ms`],
    ['Pontos desenhados', `${fmt(d.points)} de ${fmt(d.sourcePoints)} (${d.sampling})`],
    ['Distância da câmera', `${fmt(d.camDist, 3)} (R ${fmt(d.R, 3)})`],
    ['Ponto no centro', `${fmt(d.dotPx, 1)} px CSS · zoom ${fmt(d.zoom, 2)}×`],
    ['Palco · dpr', `${d.stage[0]}×${d.stage[1]} · ${d.dpr}`],
    ['Tema · fundo · ângulo', `${d.theme} · ${d.back} · ${d.angle} ${fmt(d.rotYDeg)}°`],
  ];
  el.innerHTML = rows.map(([k, v]) => `<div class="brain-debug-row"><span>${k}</span><b>${v}</b></div>`).join('');
}
