// HOME-BRAIN-001 — asset generator (deterministic).
// Runs as an async function body with helpers: readFileBinary(path) → Blob, saveFile(path, Blob|string), log(...).
// Inputs: source/* (OpenNeuro ds006128 sub-01, snapshot 1.0.11, SHA-256 checked below).
// Outputs: assets/brain-surface.glb, assets/brain-particles.bin, assets/brain-particles-attr.bin, assets/build-report.json
// Coordinate chain: FreeSurfer surface RAS (TKR, mm) → scene axes (x = Anterior, y = Superior, z = Right)
//                   → minus bbox centre of all structures → × uniform scale so the longest extent = 3.8 units.
const P = { cellMm: 1.35, targetExtent: 3.8, seed: 41005, smoothIters: 6, particles: { cortex: 36000, cerebellum: 5000, brainstem: 1000 }, particleLift: 0.012 };
const EXPECT = {
  'lh.pial.T1': '2aac780dd856e8be55362cec46663bd0eb14c03d3cac7ac3969f2083a7bf09f8',
  'rh.pial.T1': '655690359a5cf3c4cd498b31594a22014d7ad4b85620248ae60ed82b25ce3d31',
  'lh.sulc': '0aad26d4ab724eacdb337321fcf2ecae6ba3b1f2530a65729c55501875d5a9ac',
  'rh.sulc': 'cb83fcb0fd4e7cffef77636819a2faf69fe98c36e38d3d634b45899654c68e83',
  'aseg.mgz': 'd2c386e1aaa05074042b07c8c9c53e999e6172053586562227c97e77a1a41a96',
};
const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
const sha = async (b) => hex(await crypto.subtle.digest('SHA-256', b));
async function input(name) {
  const b = await (await readFileBinary('source/' + name)).arrayBuffer();
  const h = await sha(b);
  if (h !== EXPECT[name]) throw new Error('hash mismatch ' + name + ' ' + h);
  return b;
}
function readSurf(buf) {
  const dv = new DataView(buf), u = new Uint8Array(buf);
  if (u[0] !== 255 || u[1] !== 255 || u[2] !== 254) throw new Error('not a FreeSurfer triangle surface');
  let p = 3; while (!(u[p] === 10 && u[p + 1] === 10)) p++; p += 2;
  const nv = dv.getInt32(p), nf = dv.getInt32(p + 4); p += 8;
  const v = new Float32Array(nv * 3); for (let i = 0; i < nv * 3; i++) v[i] = dv.getFloat32(p + 4 * i); p += nv * 12;
  const f = new Uint32Array(nf * 3); for (let i = 0; i < nf * 3; i++) f[i] = dv.getInt32(p + 4 * i);
  return { nv, nf, v, f };
}
function readCurv(buf) {
  const dv = new DataView(buf), u = new Uint8Array(buf);
  if (u[0] !== 255 || u[1] !== 255 || u[2] !== 255) throw new Error('not a FreeSurfer curv file');
  const nv = dv.getInt32(3); const s = new Float32Array(nv);
  for (let i = 0; i < nv; i++) s[i] = dv.getFloat32(15 + 4 * i);
  return s;
}
async function readMgz(buf) {
  const raw = await new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const dv = new DataView(raw);
  const [w, h, d] = [dv.getInt32(4), dv.getInt32(8), dv.getInt32(12)], type = dv.getInt32(20);
  const size = [dv.getFloat32(30), dv.getFloat32(34), dv.getFloat32(38)];
  const mdc = []; for (let i = 0; i < 9; i++) mdc.push(dv.getFloat32(42 + 4 * i));
  const n = w * h * d, lab = new Int32Array(n), o = 284;
  for (let i = 0; i < n; i++) lab[i] = type === 0 ? dv.getUint8(o + i) : type === 1 ? dv.getInt32(o + 4 * i) : type === 4 ? dv.getInt16(o + 2 * i) : Math.round(dv.getFloat32(o + 4 * i));
  // TKR vox2ras: M = Mdc·diag(size); P0 = −M·(dim/2)
  const M = [0, 1, 2].map((r) => [0, 1, 2].map((c) => mdc[c * 3 + r] * size[c]));
  const half = [w / 2, h / 2, d / 2];
  const P0 = [0, 1, 2].map((r) => -(M[r][0] * half[0] + M[r][1] * half[1] + M[r][2] * half[2]));
  return { w, h, d, type, size, lab, M, P0 };
}
// RAS (mm) → scene axes (A, S, R). Cyclic permutation: det = +1, winding preserved.
const toScene = (r, a, s, out, i) => { out[i] = a; out[i + 1] = s; out[i + 2] = r; };

function cluster(surf, sulc, cell) {
  const { nv, nf, v, f } = surf, key = new Map(), idx = new Int32Array(nv);
  const acc = []; let n = 0;
  for (let i = 0; i < nv; i++) {
    const k = Math.floor(v[3 * i] / cell) + 512 + (Math.floor(v[3 * i + 1] / cell) + 512) * 1024 + (Math.floor(v[3 * i + 2] / cell) + 512) * 1048576;
    let c = key.get(k); if (c === undefined) { c = n++; key.set(k, c); acc.push(0, 0, 0, 0, 0); }
    idx[i] = c; const q = c * 5; acc[q] += v[3 * i]; acc[q + 1] += v[3 * i + 1]; acc[q + 2] += v[3 * i + 2]; acc[q + 3] += sulc[i]; acc[q + 4]++;
  }
  const pos = new Float32Array(n * 3), s = new Float32Array(n);
  for (let c = 0; c < n; c++) { const q = c * 5, m = acc[q + 4]; toScene(acc[q] / m, acc[q + 1] / m, acc[q + 2] / m, pos, 3 * c); s[c] = acc[q + 3] / m; }
  const seen = new Set(), out = [];
  for (let t = 0; t < nf; t++) {
    const a = idx[f[3 * t]], b = idx[f[3 * t + 1]], c = idx[f[3 * t + 2]];
    if (a === b || b === c || a === c) continue;
    const [x, y, z] = [a, b, c].sort((p, q) => p - q), k = x + y * 131072 + z * 17179869184;
    if (seen.has(k)) continue; seen.add(k); out.push(a, b, c);
  }
  return { pos, sulc: s, index: new Uint32Array(out) };
}
function blur3(field, nx, ny, nz) {
  const tmp = new Float32Array(field.length);
  const pass = (src, dst, stride, len, lenIdx) => {
    for (let i = 0; i < src.length; i++) {
      const c = lenIdx(i); let s = src[i], m = 1;
      if (c > 0) { s += src[i - stride]; m++; } if (c < len - 1) { s += src[i + stride]; m++; }
      dst[i] = s / m;
    }
  };
  pass(field, tmp, 1, nx, (i) => i % nx);
  pass(tmp, field, nx, ny, (i) => Math.floor(i / nx) % ny);
  pass(field, tmp, nx * ny, nz, (i) => Math.floor(i / (nx * ny)));
  field.set(tmp);
}
function surfaceNets(F, nx, ny, nz, iso) {
  const id = (x, y, z) => x + nx * (y + ny * z), cellV = new Int32Array(nx * ny * nz).fill(-1), V = [];
  const E = []; for (let i = 0; i < 8; i++) for (const b of [1, 2, 4]) if (!(i & b)) E.push([i, i | b]);
  const cv = new Float32Array(8);
  for (let z = 0; z < nz - 1; z++) for (let y = 0; y < ny - 1; y++) for (let x = 0; x < nx - 1; x++) {
    let mask = 0;
    for (let i = 0; i < 8; i++) { cv[i] = F[id(x + (i & 1), y + ((i >> 1) & 1), z + ((i >> 2) & 1))]; if (cv[i] > iso) mask |= 1 << i; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, m = 0;
    for (const [a, b] of E) {
      if ((cv[a] > iso) === (cv[b] > iso)) continue;
      const t = (iso - cv[a]) / (cv[b] - cv[a]);
      sx += (a & 1) + t * ((b & 1) - (a & 1)); sy += ((a >> 1) & 1) + t * (((b >> 1) & 1) - ((a >> 1) & 1)); sz += ((a >> 2) & 1) + t * (((b >> 2) & 1) - ((a >> 2) & 1)); m++;
    }
    cellV[id(x, y, z)] = V.length / 3; V.push(x + sx / m, y + sy / m, z + sz / m);
  }
  const I = [], ax = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
  for (let z = 1; z < nz - 1; z++) for (let y = 1; y < ny - 1; y++) for (let x = 1; x < nx - 1; x++) {
    const inside = F[id(x, y, z)] > iso;
    for (let d = 0; d < 3; d++) {
      const [dx, dy, dz] = ax[d];
      if ((F[id(x + dx, y + dy, z + dz)] > iso) === inside) continue;
      const u = ax[(d + 1) % 3], w = ax[(d + 2) % 3];
      const c0 = cellV[id(x, y, z)], c1 = cellV[id(x - u[0], y - u[1], z - u[2])], c2 = cellV[id(x - u[0] - w[0], y - u[1] - w[1], z - u[2] - w[2])], c3 = cellV[id(x - w[0], y - w[1], z - w[2])];
      if (c0 < 0 || c1 < 0 || c2 < 0 || c3 < 0) continue;
      if (inside) I.push(c0, c1, c2, c0, c2, c3); else I.push(c0, c2, c1, c0, c3, c2);
    }
  }
  return { V: new Float32Array(V), I: new Uint32Array(I) };
}
function taubin(pos, index, iters) {
  const n = pos.length / 3, nb = Array.from({ length: n }, () => new Set());
  for (let t = 0; t < index.length; t += 3) { const [a, b, c] = [index[t], index[t + 1], index[t + 2]]; nb[a].add(b).add(c); nb[b].add(a).add(c); nb[c].add(a).add(b); }
  const tmp = new Float32Array(pos.length);
  const step = (k) => {
    for (let i = 0; i < n; i++) { let sx = 0, sy = 0, sz = 0; for (const j of nb[i]) { sx += pos[3 * j]; sy += pos[3 * j + 1]; sz += pos[3 * j + 2]; } const m = nb[i].size || 1; tmp[3 * i] = pos[3 * i] + k * (sx / m - pos[3 * i]); tmp[3 * i + 1] = pos[3 * i + 1] + k * (sy / m - pos[3 * i + 1]); tmp[3 * i + 2] = pos[3 * i + 2] + k * (sz / m - pos[3 * i + 2]); }
    pos.set(tmp);
  };
  for (let i = 0; i < iters; i++) { step(0.5); step(-0.53); }
}
function structureMesh(vol, labels) {
  const { w, h, d, lab, M, P0 } = vol; let lo = [w, h, d], hi = [0, 0, 0];
  for (let k = 0; k < d; k++) for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (labels.includes(lab[i + w * (j + h * k)])) { lo = [Math.min(lo[0], i), Math.min(lo[1], j), Math.min(lo[2], k)]; hi = [Math.max(hi[0], i), Math.max(hi[1], j), Math.max(hi[2], k)]; }
  const pad = 4, o = lo.map((x) => x - pad), nx = hi[0] - lo[0] + 1 + 2 * pad, ny = hi[1] - lo[1] + 1 + 2 * pad, nz = hi[2] - lo[2] + 1 + 2 * pad;
  const F = new Float32Array(nx * ny * nz);
  for (let z = 0; z < nz; z++) for (let y = 0; y < ny; y++) for (let x = 0; x < nx; x++) {
    const i = x + o[0], j = y + o[1], k = z + o[2];
    if (i >= 0 && j >= 0 && k >= 0 && i < w && j < h && k < d && labels.includes(lab[i + w * (j + h * k)])) F[x + nx * (y + ny * z)] = 1;
  }
  blur3(F, nx, ny, nz); blur3(F, nx, ny, nz);
  const { V, I } = surfaceNets(F, nx, ny, nz, 0.5);
  const pos = new Float32Array(V.length);
  for (let q = 0; q < V.length; q += 3) {
    const i = V[q] + o[0], j = V[q + 1] + o[1], k = V[q + 2] + o[2];
    const r = M[0][0] * i + M[0][1] * j + M[0][2] * k + P0[0], a = M[1][0] * i + M[1][1] * j + M[1][2] * k + P0[1], s = M[2][0] * i + M[2][1] * j + M[2][2] * k + P0[2];
    toScene(r, a, s, pos, q);
  }
  taubin(pos, I, P.smoothIters);
  return { pos, index: I, sulc: new Float32Array(pos.length / 3), voxels: { origin: o, dims: [nx, ny, nz] } };
}
function signedVolume(pos, index) {
  let v = 0; for (let t = 0; t < index.length; t += 3) { const a = 3 * index[t], b = 3 * index[t + 1], c = 3 * index[t + 2];
    v += pos[a] * (pos[b + 1] * pos[c + 2] - pos[b + 2] * pos[c + 1]) - pos[a + 1] * (pos[b] * pos[c + 2] - pos[b + 2] * pos[c]) + pos[a + 2] * (pos[b] * pos[c + 1] - pos[b + 1] * pos[c]); }
  return v / 6;
}
function orientOutward(m) {
  const n = m.pos.length / 3; let cx = 0, cy = 0, cz = 0; for (let i = 0; i < n; i++) { cx += m.pos[3 * i]; cy += m.pos[3 * i + 1]; cz += m.pos[3 * i + 2]; }
  cx /= n; cy /= n; cz /= n; const p = m.pos.slice(); for (let i = 0; i < n; i++) { p[3 * i] -= cx; p[3 * i + 1] -= cy; p[3 * i + 2] -= cz; }
  const vol = signedVolume(p, m.index); if (vol < 0) for (let t = 0; t < m.index.length; t += 3) { const x = m.index[t + 1]; m.index[t + 1] = m.index[t + 2]; m.index[t + 2] = x; }
  return vol < 0 ? 'flipped' : 'kept';
}
function normals(pos, index) {
  const nrm = new Float32Array(pos.length);
  for (let t = 0; t < index.length; t += 3) {
    const a = 3 * index[t], b = 3 * index[t + 1], c = 3 * index[t + 2];
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const q of [a, b, c]) { nrm[q] += nx; nrm[q + 1] += ny; nrm[q + 2] += nz; }
  }
  for (let i = 0; i < nrm.length; i += 3) { const l = Math.hypot(nrm[i], nrm[i + 1], nrm[i + 2]) || 1; nrm[i] /= l; nrm[i + 1] /= l; nrm[i + 2] /= l; }
  return nrm;
}
// Default baked palette (tokens.css): crown --raw-bg-subtle #F7F5F3 → sulcus derived alias #C9C3BC (documented in HANDOFF).
const CROWN = [0xf7, 0xf5, 0xf3], FUNDUS = [0xc9, 0xc3, 0xbc];
const depth01 = (s) => { const t = Math.min(1, Math.max(0, (s + 0.6) / 1.5)); return t * t * (3 - 2 * t); };
function bakeColor(sulc, flat) {
  const c = new Uint8Array(sulc.length * 4);
  for (let i = 0; i < sulc.length; i++) { const t = flat ?? depth01(sulc[i]); for (let k = 0; k < 3; k++) c[4 * i + k] = Math.round(CROWN[k] + (FUNDUS[k] - CROWN[k]) * t); c[4 * i + 3] = 255; }
  return c;
}
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function sample(meshes, count, rnd, weightFn, structId, out, attr, start) {
  const tris = [], cum = []; let total = 0;
  for (const m of meshes) for (let t = 0; t < m.index.length; t += 3) {
    const a = m.index[t], b = m.index[t + 1], c = m.index[t + 2], p = m.pos;
    const ux = p[3 * b] - p[3 * a], uy = p[3 * b + 1] - p[3 * a + 1], uz = p[3 * b + 2] - p[3 * a + 2], vx = p[3 * c] - p[3 * a], vy = p[3 * c + 1] - p[3 * a + 1], vz = p[3 * c + 2] - p[3 * a + 2];
    const area = 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx);
    total += area * weightFn((m.sulc[a] + m.sulc[b] + m.sulc[c]) / 3); tris.push(m, a, b, c); cum.push(total);
  }
  for (let i = 0; i < count; i++) {
    const r = rnd() * total; let lo = 0, hi = cum.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < r) lo = mid + 1; else hi = mid; }
    const [m, a, b, c] = tris.slice(lo * 4, lo * 4 + 4); let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; } const wgt = 1 - u - v;
    const q = 3 * (start + i);
    for (let k = 0; k < 3; k++) out[q + k] = wgt * m.pos[3 * a + k] + u * m.pos[3 * b + k] + v * m.pos[3 * c + k] + P.particleLift * (wgt * m.nrm[3 * a + k] + u * m.nrm[3 * b + k] + v * m.nrm[3 * c + k]);
    const s = wgt * m.sulc[a] + u * m.sulc[b] + v * m.sulc[c];
    attr[2 * (start + i)] = Math.round(depth01(s) * 255); attr[2 * (start + i) + 1] = structId;
  }
}
function writeGlb(meshes, extras) {
  const views = [], accessors = [], chunks = []; let offset = 0;
  const add = (typed, target, acc) => {
    const bytes = new Uint8Array(typed.buffer, typed.byteOffset, typed.byteLength); const pad = (4 - (bytes.length % 4)) % 4;
    views.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, target }); chunks.push(bytes); if (pad) chunks.push(new Uint8Array(pad)); offset += bytes.length + pad;
    accessors.push({ bufferView: views.length - 1, ...acc }); return accessors.length - 1;
  };
  const gm = [], nodes = [];
  for (const m of meshes) {
    const n = m.pos.length / 3, mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
    for (let i = 0; i < n; i++) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], m.pos[3 * i + k]); mx[k] = Math.max(mx[k], m.pos[3 * i + k]); }
    const attributes = {
      POSITION: add(m.pos, 34962, { componentType: 5126, count: n, type: 'VEC3', min: mn, max: mx }),
      NORMAL: add(m.nrm, 34962, { componentType: 5126, count: n, type: 'VEC3' }),
      COLOR_0: add(m.col, 34962, { componentType: 5121, normalized: true, count: n, type: 'VEC4' }),
      _SULC: add(m.sulc, 34962, { componentType: 5126, count: n, type: 'SCALAR' }),
    };
    const indices = add(m.index, 34963, { componentType: 5125, count: m.index.length, type: 'SCALAR' });
    gm.push({ name: m.name, primitives: [{ attributes, indices, material: m.material, mode: 4 }] });
    nodes.push({ name: m.name, mesh: gm.length - 1 });
  }
  nodes.push({ name: 'HOME-BRAIN-001', children: meshes.map((_, i) => i), extras });
  const json = {
    asset: { version: '2.0', generator: 'HOME-BRAIN-001 build-brain-assets.js', copyright: 'Derived from OpenNeuro ds006128 (CC0-1.0)' },
    scene: 0, scenes: [{ name: 'brain', nodes: [nodes.length - 1] }], nodes, meshes: gm,
    materials: [
      { name: 'brain-cortex', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.82 } },
      { name: 'brain-subcortical', pbrMetallicRoughness: { baseColorFactor: [1, 1, 1, 1], metallicFactor: 0, roughnessFactor: 0.88 } },
    ],
    accessors, bufferViews: views, buffers: [{ byteLength: offset }],
  };
  let js = new TextEncoder().encode(JSON.stringify(json)); const jp = (4 - (js.length % 4)) % 4;
  const jsonChunk = new Uint8Array(js.length + jp).fill(0x20); jsonChunk.set(js);
  const total = 12 + 8 + jsonChunk.length + 8 + offset, out = new Uint8Array(total), dv = new DataView(out.buffer);
  dv.setUint32(0, 0x46546c67, true); dv.setUint32(4, 2, true); dv.setUint32(8, total, true);
  dv.setUint32(12, jsonChunk.length, true); dv.setUint32(16, 0x4e4f534a, true); out.set(jsonChunk, 20);
  let p = 20 + jsonChunk.length; dv.setUint32(p, offset, true); dv.setUint32(p + 4, 0x004e4942, true); p += 8;
  for (const c of chunks) { out.set(c, p); p += c.length; }
  return out;
}

// ---- pipeline ----
const t0 = performance.now();
const lhS = readSurf(await input('lh.pial.T1')), rhS = readSurf(await input('rh.pial.T1'));
const lhC = readCurv(await input('lh.sulc')), rhC = readCurv(await input('rh.sulc'));
if (lhC.length !== lhS.nv || rhC.length !== rhS.nv) throw new Error('sulc/vertex count mismatch');
const vol = await readMgz(await input('aseg.mgz'));
const lh = { name: 'cortex-left', material: 0, ...cluster(lhS, lhC, P.cellMm) };
const rh = { name: 'cortex-right', material: 0, ...cluster(rhS, rhC, P.cellMm) };
const cb = { name: 'cerebellum', material: 1, ...structureMesh(vol, [7, 8, 46, 47]) };
const bs = { name: 'brain-stem', material: 1, ...structureMesh(vol, [16]) };
const meshes = [lh, rh, cb, bs];
const orient = meshes.map(orientOutward);
const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
for (const m of meshes) for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], m.pos[i + k]); mx[k] = Math.max(mx[k], m.pos[i + k]); }
const centre = [0, 1, 2].map((k) => (mn[k] + mx[k]) / 2), extentMm = [0, 1, 2].map((k) => mx[k] - mn[k]);
const scale = P.targetExtent / Math.max(...extentMm);
for (const m of meshes) { for (let i = 0; i < m.pos.length; i += 3) for (let k = 0; k < 3; k++) m.pos[i + k] = (m.pos[i + k] - centre[k]) * scale; m.nrm = normals(m.pos, m.index); }
lh.col = bakeColor(lh.sulc); rh.col = bakeColor(rh.sulc); cb.col = bakeColor(cb.sulc, 0.32); bs.col = bakeColor(bs.sulc, 0.32);
const transform = { from: 'FreeSurfer surface RAS / TKR (mm); aseg voxels via TKR vox2ras', axes: 'scene.x = A, scene.y = S, scene.z = R (cyclic permutation, det +1)', centreMm_sceneAxes: centre, scale_unitsPerMm: scale, mmPerUnit: 1 / scale, extentMm_sceneAxes: extentMm, targetExtentUnits: P.targetExtent };
const glb = writeGlb(meshes, { id: 'HOME-BRAIN-001', dataset: 'OpenNeuro ds006128 sub-01 snapshot 1.0.11', license: 'CC0-1.0', transform, params: P });
await saveFile('assets/brain-surface.glb', new Blob([glb], { type: 'application/octet-stream' }));
// particles
const N = P.particles.cortex + P.particles.cerebellum + P.particles.brainstem, xyz = new Float32Array(N * 3), attr = new Uint8Array(N * 2), rnd = mulberry32(P.seed);
sample([lh, rh], P.particles.cortex, rnd, (s) => 1 - 0.7 * depth01(s), 0, xyz, attr, 0);
sample([cb], P.particles.cerebellum, rnd, () => 1, 1, xyz, attr, P.particles.cortex);
sample([bs], P.particles.brainstem, rnd, () => 1, 2, xyz, attr, P.particles.cortex + P.particles.cerebellum);
const q = new Int16Array(N * 3); for (let i = 0; i < q.length; i++) q[i] = Math.round(Math.max(-1, Math.min(1, xyz[i] / 2)) * 32767);
await saveFile('assets/brain-particles.bin', new Blob([q.buffer]));
await saveFile('assets/brain-particles-attr.bin', new Blob([attr.buffer]));
const report = {
  generatedAt: new Date().toISOString(), params: P, inputs: Object.fromEntries(Object.entries(EXPECT).map(([k, v]) => [k, { sha256: v, verified: true }])),
  freesurfer: { lh: { vertices: lhS.nv, faces: lhS.nf }, rh: { vertices: rhS.nv, faces: rhS.nf } },
  aseg: { dims: [vol.w, vol.h, vol.d], type: vol.type, voxelMm: vol.size, labels: { cerebellum: [7, 8, 46, 47], brainstem: [16] } },
  meshes: meshes.map((m, i) => ({ name: m.name, vertices: m.pos.length / 3, triangles: m.index.length / 3, winding: orient[i] })),
  transform, glb: { bytes: glb.length, sha256: await sha(glb.buffer) },
  particles: { count: N, bytes: q.byteLength, sha256: await sha(q.buffer), attrBytes: attr.byteLength, attrSha256: await sha(attr.buffer) },
  ms: Math.round(performance.now() - t0),
};
await saveFile('assets/build-report.json', JSON.stringify(report, null, 2));
log(JSON.stringify(report, null, 1));
