// HOME-BRAIN-001 · hollow representation (RC-BRAIN-CRITIQUE-001). three.js r184.
// Same anatomy as brain-scene.js, but the triangle mesh is never drawn: it is sliced into contour
// lines (the "graticule") and used for anchor normals. Points are masked into dotted fields + open voids.
import * as THREE from 'three';
import { parseGlb } from './brain-scene.js';

export const HOLLOW_DEFAULTS = {
  background: '#ffffff',
  wire: { front: '#c4c5ce', back: '#dcdde3', opacity: 0.85, backAlpha: 0.18, latitudes: 13, meridians: 9, outward: 0.15 },
  points: { light: '#bfc2f8', deep: '#5a5fe8', sizePx: 1.9, opacity: 1, backAlpha: 0.14, maskScale: 1.7, maskThreshold: 0.55, maskFeather: 0.07, maxDepth: 0.62 },
};

function accessor(g, i) {
  const a = g.json.accessors[i], v = g.json.bufferViews[a.bufferView];
  const C = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array, 5121: Uint8Array }[a.componentType];
  const n = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[a.type];
  return new C(g.bin, (v.byteOffset || 0) + (a.byteOffset || 0), a.count * n);
}

// Deterministic 3D value noise (fbm, 2 octaves) — the spatial mask that alternates dotted fields and voids.
function hash(x, y, z) { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf), L = (a, b, t) => a + (b - a) * t;
  return L(L(L(hash(xi, yi, zi), hash(xi + 1, yi, zi), u), L(hash(xi, yi + 1, zi), hash(xi + 1, yi + 1, zi), u), v),
           L(L(hash(xi, yi, zi + 1), hash(xi + 1, yi, zi + 1), u), L(hash(xi, yi + 1, zi + 1), hash(xi + 1, yi + 1, zi + 1), u), v), w);
}
const fbm = (x, y, z) => 0.66 * vnoise(x, y, z) + 0.34 * vnoise(x * 2.1 + 5.2, y * 2.1 + 1.3, z * 2.1 + 7.7);

const VS_DEPTH = `uniform float uCam; varying float vBack;
float backOf(vec4 mv) { return clamp((-mv.z - (uCam - 1.7)) / 3.4, 0.0, 1.0); }`;
const LINE_VS = `${VS_DEPTH}
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vBack = backOf(mv); gl_Position = projectionMatrix * mv; }`;
const LINE_FS = `uniform vec3 uFront; uniform vec3 uBackC; uniform float uOpacity; uniform float uBackAlpha; varying float vBack;
void main() { gl_FragColor = vec4(mix(uFront, uBackC, vBack), uOpacity * mix(1.0, uBackAlpha, smoothstep(0.0, 1.0, vBack)));
#include <colorspace_fragment>
}`;
const PT_VS = `${VS_DEPTH}
attribute float aW; uniform float uSize; uniform float uDpr; uniform float uRef; varying float vW;
void main() { vec4 mv = modelViewMatrix * vec4(position, 1.0); vBack = backOf(mv); vW = aW;
  gl_PointSize = uSize * uDpr * (uRef / -mv.z) * mix(0.8, 1.1, aW); gl_Position = projectionMatrix * mv; }`;
const PT_FS = `uniform vec3 uLight; uniform vec3 uDeep; uniform float uOpacity; uniform float uBackAlpha; varying float vBack; varying float vW;
void main() { float r = length(gl_PointCoord - 0.5); float a = 1.0 - smoothstep(0.36, 0.5, r); if (a < 0.01) discard;
  gl_FragColor = vec4(mix(uLight, uDeep, vW), a * uOpacity * mix(1.0, uBackAlpha, smoothstep(0.0, 1.0, vBack)));
#include <colorspace_fragment>
}`;

// Slice cortex triangles with horizontal planes (latitudes) and vertical planes through the y axis (meridians).
function contours(meshes, lat, mer, outward) {
  let ymin = Infinity, ymax = -Infinity;
  for (const { p } of meshes) for (let i = 1; i < p.length; i += 3) { ymin = Math.min(ymin, p[i]); ymax = Math.max(ymax, p[i]); }
  const pad = (ymax - ymin) * 0.04, levels = [];
  for (let k = 0; k < lat; k++) levels.push(ymin + pad + ((ymax - ymin - 2 * pad) * (k + 0.5)) / lat);
  const planes = [];
  for (let k = 0; k < mer; k++) { const t = (k / mer) * Math.PI; planes.push([-Math.sin(t), Math.cos(t)]); }
  const out = [];
  const cut = (ax, ay, az, bx, by, bz, cx, cy, cz, da, db, dc) => {
    const e = [];
    const edge = (x1, y1, z1, d1, x2, y2, z2, d2) => { if ((d1 > 0) !== (d2 > 0)) { const t = d1 / (d1 - d2); e.push(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, z1 + (z2 - z1) * t); } };
    edge(ax, ay, az, da, bx, by, bz, db); edge(bx, by, bz, db, cx, cy, cz, dc); edge(cx, cy, cz, dc, ax, ay, az, da);
    if (e.length === 6) out.push(...e);
  };
  for (const { p, idx, nrm } of meshes) {
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      if (outward != null) { const N = nrm, px = p[a], py = p[a + 1], pz = p[a + 2], l = Math.hypot(px, py, pz) || 1;
        if ((N[a] * px + N[a + 1] * py + N[a + 2] * pz) / l < outward) continue; } // drop medial wall + sulcal walls → shell only
      const ax = p[a], ay = p[a + 1], az = p[a + 2], bx = p[b], by = p[b + 1], bz = p[b + 2], cx = p[c], cy = p[c + 1], cz = p[c + 2];
      const lo = Math.min(ay, by, cy), hi = Math.max(ay, by, cy);
      for (const y of levels) if (y > lo && y < hi) cut(ax, ay, az, bx, by, bz, cx, cy, cz, ay - y + 1e-7, by - y + 1e-7, cy - y + 1e-7);
      for (const [nx, nz] of planes) cut(ax, ay, az, bx, by, bz, cx, cy, cz, nx * ax + nz * az + 1e-7, nx * bx + nz * bz + 1e-7, nx * cx + nz * cz + 1e-7);
    }
  }
  return new Float32Array(out);
}

export function createHollowBrain({ glb, pts, attr }, cfg = HOLLOW_DEFAULTS) {
  const g = parseGlb(glb), col = (h) => new THREE.Color(h);
  const cortex = [];
  for (const m of g.json.meshes) {
    const pr = m.primitives[0]; if (pr.material !== 0) continue;
    cortex.push({ name: m.name, p: accessor(g, pr.attributes.POSITION), nrm: accessor(g, pr.attributes.NORMAL), idx: accessor(g, pr.indices) });
  }
  const W = cfg.wire, P = cfg.points;
  const lgeo = new THREE.BufferGeometry();
  lgeo.setAttribute('position', new THREE.BufferAttribute(contours(cortex, W.latitudes, W.meridians, W.outward), 3));
  const lu = { uCam: { value: 6.6 }, uFront: { value: col(W.front) }, uBackC: { value: col(W.back) }, uOpacity: { value: W.opacity }, uBackAlpha: { value: W.backAlpha } };
  const lines = new THREE.LineSegments(lgeo, new THREE.ShaderMaterial({ name: 'brain-wire', uniforms: lu, vertexShader: LINE_VS, fragmentShader: LINE_FS, transparent: true, depthWrite: false }));
  lines.name = 'brain-wire'; lines.renderOrder = 1;

  // Points: int16 xyz (/32767·2) + uint8 [sulcal depth, structure]. Mask → keep dotted fields, weight → colour depth.
  const q = new Int16Array(pts), a = new Uint8Array(attr), n = q.length / 3;
  const pos = [], w = [], s = P.maskScale, t0 = P.maskThreshold, f = P.maskFeather;
  for (let i = 0; i < n; i++) {
    if (a[2 * i + 1] === 2 || a[2 * i] / 255 > P.maxDepth) continue; // brainstem + sulcal fundus stay open
    const x = (q[3 * i] / 32767) * 2, y = (q[3 * i + 1] / 32767) * 2, z = (q[3 * i + 2] / 32767) * 2;
    const v = fbm(x * s + 11, y * s + 3, z * s + 17);
    const keep = (v - (t0 - f)) / (2 * f); // dithered edge
    if (keep <= 0 || (keep < 1 && hash(i, 3.1, 9.7) > keep)) continue;
    pos.push(x, y, z); w.push(Math.min(1, Math.max(0, (v - t0) / 0.16)) * 0.75 + (1 - a[2 * i] / 255) * 0.25);
  }
  const pgeo = new THREE.BufferGeometry();
  pgeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  pgeo.setAttribute('aW', new THREE.Float32BufferAttribute(w, 1));
  const pu = { uCam: lu.uCam, uSize: { value: P.sizePx }, uDpr: { value: 1 }, uRef: { value: 6.6 }, uLight: { value: col(P.light) }, uDeep: { value: col(P.deep) }, uOpacity: { value: P.opacity }, uBackAlpha: { value: P.backAlpha } };
  const points = new THREE.Points(pgeo, new THREE.ShaderMaterial({ name: 'brain-points', uniforms: pu, vertexShader: PT_VS, fragmentShader: PT_FS, transparent: true, depthWrite: false }));
  points.name = 'brain-points'; points.renderOrder = 2;

  const root = new THREE.Group(); root.name = 'brain-hollow'; root.add(lines, points);

  /** Outermost cortex vertex along a direction (object space) + its surface normal. */
  function anchor(dir) {
    const d = new THREE.Vector3(...dir).normalize(); let best = -Infinity, hit = null;
    for (const m of cortex) for (let i = 0; i < m.p.length; i += 3) {
      const sc = m.p[i] * d.x + m.p[i + 1] * d.y + m.p[i + 2] * d.z;
      if (sc > best) { best = sc; hit = [m, i]; }
    }
    const [m, i] = hit;
    return { p: new THREE.Vector3(m.p[i], m.p[i + 1], m.p[i + 2]), n: new THREE.Vector3(m.nrm[i], m.nrm[i + 1], m.nrm[i + 2]).normalize() };
  }
  function setView(camDist, dpr) { lu.uCam.value = camDist; pu.uRef.value = 6.6; if (dpr) pu.uDpr.value = dpr; }
  function setLayers({ wire = true, points: p = true } = {}) { lines.visible = wire; points.visible = p; }
  const stats = () => ({ wireSegments: lgeo.attributes.position.count / 2, points: pos.length / 3, sourcePoints: n });
  return { root, lines, points, anchor, setView, setLayers, stats };
}
