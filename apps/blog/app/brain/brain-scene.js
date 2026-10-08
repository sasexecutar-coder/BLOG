// HOME-BRAIN-001 — scene module (three.js r184). Framework-free; the React integration imports this file as-is.
// Exports: parseGlb, inspectGlb, loadBrainAssets, createBrain, DEFAULT_CONFIG.
import * as THREE from 'three';

export const DEFAULT_CONFIG = {
  version: '1.1.0',
  mode: 'combined',            // 'surface' | 'points' | 'combined'
  hideBack: true,              // surface writes depth even when hidden (points mode)
  background: '#ffffff',
  surface: { opacity: 1, roughness: 0.82, sulcStrength: 1, crown: '#f7f7f9', fundus: '#c3c4cc', subcortical: 0.32 },
  particles: { density: 1, sizePx: 1.8, opacity: 0.9, color: '#a3a8f5', crownColor: '#5a5fe8', crownMix: 0.55, backFade: 0.85 },
  lines: { visible: true, color: '#d6d8f2', intensity: 0.7, spacingUnits: 0.24, meridians: 24, widthPx: 1 },
  light: { ambient: 1.15, key: 1.7, fill: 0.55, keyAzimuthDeg: -35, keyElevationDeg: 40, depthFog: 0.35 },
  camera: { view: 'three-quarter', distanceUnits: 6.0, fovDeg: 34 },
  motion: { speedRadPerSec: 0.12, paused: false, reducedMotion: false },
};
export const VIEWS = {
  'three-quarter': [0.18, -0.38, 0], 'lateral-right': [0.08, 0, 0], 'lateral-left': [0.08, Math.PI, 0],
  frontal: [0.1, -Math.PI / 2, 0], posterior: [0.1, Math.PI / 2, 0], superior: [1.45, 0, 0],
};

export function parseGlb(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, true) !== 0x46546c67) throw new Error('not a GLB');
  let p = 12, json, bin;
  while (p < buf.byteLength) {
    const len = dv.getUint32(p, true), type = dv.getUint32(p + 4, true);
    if (type === 0x4e4f534a) json = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, p + 8, len)));
    else if (type === 0x004e4942) bin = buf.slice(p + 8, p + 8 + len);
    p += 8 + len;
  }
  return { json, bin };
}
const MODES = ['POINTS', 'LINES', 'LINE_LOOP', 'LINE_STRIP', 'TRIANGLES', 'TRIANGLE_STRIP', 'TRIANGLE_FAN'];
/** Reopens a GLB from bytes alone and lists every primitive: mode, vertices, triangles, attributes, material. */
export function inspectGlb(buf) {
  const { json } = parseGlb(buf), A = json.accessors;
  const meshes = (json.meshes || []).map((m, mi) => ({
    name: m.name || json.nodes?.find((n) => n.mesh === mi)?.name || 'mesh_' + mi,
    primitives: m.primitives.map((pr) => {
      const mode = pr.mode ?? 4, v = A[pr.attributes.POSITION].count, i = pr.indices != null ? A[pr.indices].count : v;
      return { mode: MODES[mode], vertices: v, triangles: mode === 4 ? i / 3 : 0, attributes: Object.keys(pr.attributes), material: json.materials?.[pr.material]?.name ?? null };
    }),
  }));
  const prims = meshes.flatMap((m) => m.primitives);
  return {
    bytes: buf.byteLength, generator: json.asset?.generator, nodes: (json.nodes || []).map((n) => n.name), meshes,
    totals: { meshes: meshes.length, primitives: prims.length, vertices: prims.reduce((s, p) => s + p.vertices, 0), triangles: prims.reduce((s, p) => s + p.triangles, 0) },
    allTriangles: prims.length > 0 && prims.every((p) => p.mode === 'TRIANGLES' && p.triangles > 0 && Number.isInteger(p.triangles)),
  };
}
function accessor(g, i) {
  const a = g.json.accessors[i], v = g.json.bufferViews[a.bufferView];
  const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  return new C(g.bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * n);
}

export async function loadBrainAssets(base = 'assets/', signal) {
  const get = async (f) => { const r = await fetch(base + f, { signal }); if (!r.ok) throw new Error(f + ': ' + r.status); return r.arrayBuffer(); };
  const [glb, pts, attr] = await Promise.all([get('brain-surface.glb'), get('brain-particles.bin'), get('brain-particles-attr.bin')]);
  if (pts.byteLength % 6 || attr.byteLength * 3 !== pts.byteLength) throw new Error('invalid particle assets');
  return { glb, pts, attr };
}

// Surface shader patch: sulcal depth → colour ramp, plus an object-space graticule (latitude planes + meridians around y).
function surfaceMaterial(name, uniforms, flat) {
  const m = new THREE.MeshStandardMaterial({ name, color: 0xffffff, roughness: 0.82, metalness: 0, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const uFlat = { value: flat }; m.userData.uFlat = uFlat;
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, uniforms, { uFlat });
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float _sulc;\nvarying float vSulc;\nvarying vec3 vObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSulc = _sulc;\nvObj = position;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', `#include <common>
uniform vec3 uCrown; uniform vec3 uFundus; uniform float uSulc; uniform float uFlat;
uniform vec3 uLineColor; uniform float uLine; uniform float uSpacing; uniform float uMeridians; uniform float uLineWidth;
varying float vSulc; varying vec3 vObj;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
float depth = uFlat >= 0.0 ? uFlat : smoothstep(-0.6, 0.9, vSulc);
diffuseColor.rgb = mix(uCrown, uFundus, clamp(depth * uSulc, 0.0, 1.0));
float la = vObj.y / uSpacing; float fl = abs(fract(la - 0.5) - 0.5) / max(fwidth(la), 1e-4);
float me = atan(vObj.z, vObj.x) / 6.2831853 * uMeridians; float fm = abs(fract(me - 0.5) - 0.5) / max(fwidth(me), 1e-4);
float ln = 1.0 - clamp(min(fl, fm) / uLineWidth, 0.0, 1.0);
diffuseColor.rgb = mix(diffuseColor.rgb, uLineColor, ln * uLine);`);
  };
  m.customProgramCacheKey = () => 'brain-surface-v1';
  return m;
}

const POINT_VS = `
attribute float aDepth; uniform float uSize; uniform float uDpr; uniform float uRef; uniform float uCam;
varying float vDepth; varying float vBack;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vDepth = aDepth;
  vBack = clamp((-mv.z - (uCam - 1.9)) / 3.8, 0.0, 1.0);
  gl_PointSize = uSize * uDpr * (uRef / -mv.z) * mix(1.15, 0.8, aDepth);
  gl_Position = projectionMatrix * mv;
}`;
const POINT_FS = `
uniform vec3 uColor; uniform vec3 uCrownColor; uniform float uCrownMix; uniform float uOpacity; uniform float uBackFade;
varying float vDepth; varying float vBack;
void main() {
  vec2 c = gl_PointCoord - 0.5; float r = length(c);
  float a = 1.0 - smoothstep(0.38, 0.5, r);
  if (a <= 0.01) discard;
  vec3 col = mix(uColor, uCrownColor, uCrownMix * (1.0 - vDepth));
  gl_FragColor = vec4(col, a * uOpacity * (1.0 - uBackFade * vBack));
  #include <colorspace_fragment>
}`;

/** Builds { root, surface, points, apply(config), dispose() }. `surface` is the exportable group (named meshes/materials). */
export function createBrain({ glb, pts, attr }) {
  const g = parseGlb(glb), col = (h) => new THREE.Color(h);
  const su = {
    uCrown: { value: col('#f7f5f3') }, uFundus: { value: col('#c9c3bc') }, uSulc: { value: 1 },
    uLineColor: { value: col('#d9d5d0') }, uLine: { value: 0.5 }, uSpacing: { value: 0.24 }, uMeridians: { value: 24 }, uLineWidth: { value: 1 },
  };
  const matCortex = surfaceMaterial('brain-cortex', su, -1), matSub = surfaceMaterial('brain-subcortical', su, 0.32);
  const surface = new THREE.Group(); surface.name = 'HOME-BRAIN-001';
  for (const m of g.json.meshes) {
    const pr = m.primitives[0], geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(accessor(g, pr.attributes.POSITION), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(accessor(g, pr.attributes.NORMAL), 3));
    geo.setAttribute('color', new THREE.BufferAttribute(accessor(g, pr.attributes.COLOR_0), 4, true));
    geo.setAttribute('_sulc', new THREE.BufferAttribute(accessor(g, pr.attributes._SULC), 1));
    geo.setIndex(new THREE.BufferAttribute(accessor(g, pr.indices), 1));
    geo.computeBoundingSphere();
    const mesh = new THREE.Mesh(geo, pr.material === 0 ? matCortex : matSub);
    mesh.name = m.name; mesh.renderOrder = 1; surface.add(mesh);
  }
  // Particles: int16 xyz (value / 32767 · 2) + uint8 [depth 0 crown…255 fundus, structure 0 cortex | 1 cerebellum | 2 stem].
  const q = new Int16Array(pts), a = new Uint8Array(attr), n = q.length / 3;
  const order = Array.from({ length: n }, (_, i) => i); let s = 7; // deterministic shuffle so drawRange density keeps all structures
  for (let i = n - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1); [order[i], order[j]] = [order[j], order[i]]; }
  const pos = new Float32Array(n * 3), dep = new Float32Array(n);
  order.forEach((src, i) => { for (let k = 0; k < 3; k++) pos[3 * i + k] = (q[3 * src + k] / 32767) * 2; dep[i] = a[2 * src] / 255; });
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  pgeo.setAttribute('aDepth', new THREE.BufferAttribute(dep, 1));
  const pu = {
    uSize: { value: 1.6 }, uDpr: { value: 1 }, uRef: { value: 6.6 }, uCam: { value: 6.6 },
    uColor: { value: col('#f3a06b') }, uCrownColor: { value: col('#f56a1c') }, uCrownMix: { value: 0.5 }, uOpacity: { value: 0.9 }, uBackFade: { value: 0.85 },
  };
  const pmat = new THREE.ShaderMaterial({ name: 'brain-particles', uniforms: pu, vertexShader: POINT_VS, fragmentShader: POINT_FS, transparent: true, depthWrite: false });
  const points = new THREE.Points(pgeo, pmat); points.name = 'brain-particles'; points.renderOrder = 2;
  const root = new THREE.Group(); root.name = 'brain-pivot'; root.add(surface, points);

  function apply(c, ctx = {}) {
    const S = c.surface, P = c.particles, L = c.lines;
    const showSurface = c.mode !== 'points', showPoints = c.mode !== 'surface';
    for (const m of [matCortex, matSub]) {
      m.roughness = S.roughness; m.opacity = S.opacity; m.transparent = S.opacity < 0.999;
      m.colorWrite = showSurface; m.depthWrite = showSurface || c.hideBack; m.needsUpdate = true;
    }
    matSub.userData.uFlat.value = S.subcortical;
    surface.visible = showSurface || c.hideBack;
    su.uCrown.value.set(S.crown); su.uFundus.value.set(S.fundus); su.uSulc.value = S.sulcStrength;
    su.uLineColor.value.set(L.color); su.uLine.value = L.visible ? L.intensity : 0; su.uSpacing.value = L.spacingUnits; su.uMeridians.value = Math.round(L.meridians); su.uLineWidth.value = L.widthPx;
    points.visible = showPoints;
    pgeo.setDrawRange(0, Math.round(n * P.density));
    pu.uSize.value = P.sizePx; pu.uOpacity.value = P.opacity; pu.uColor.value.set(P.color); pu.uCrownColor.value.set(P.crownColor);
    pu.uCrownMix.value = P.crownMix; pu.uBackFade.value = P.backFade; pu.uRef.value = 6.6; pu.uCam.value = c.camera.distanceUnits;
    if (ctx.dpr) pu.uDpr.value = ctx.dpr;
  }
  const stats = () => {
    let tris = 0, verts = 0; surface.traverse((o) => { if (o.isMesh) { tris += o.geometry.index.count / 3; verts += o.geometry.attributes.position.count; } });
    return { triangles: tris, vertices: verts, particles: n, particlesDrawn: pgeo.drawRange.count === Infinity ? n : pgeo.drawRange.count };
  };
  function dispose() {
    surface.traverse((o) => o.isMesh && o.geometry.dispose());
    matCortex.dispose(); matSub.dispose(); pgeo.dispose(); pmat.dispose();
  }
  return { root, surface, points, apply, stats, dispose };
}
