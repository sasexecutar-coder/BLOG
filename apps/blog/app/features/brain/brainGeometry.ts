// HOME-BRAIN-001 — geometria do cérebro: partículas sobre a malha, âncoras e enquadramento.
// Funções puras (sem React nem WebGL): rodam em Node, o que permite medir contagens e tempos nos testes.
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

export type NamedGeometry = { name: string; geometry: THREE.BufferGeometry };

export type BrainCloud = {
  /** Posições (x,y,z) no espaço nativo da malha, em ordem de aceitação do blue-noise. */
  positions: Float32Array;
  /** 0 = fundo do sulco, 1 = coroa do giro (por ponto). */
  crown: Float32Array;
  centroid: THREE.Vector3;
  /** Esfera justa dos pontos: maior distância ao centroide. */
  radius: number;
  count: number;
  timings: { sampleMs: number; blueNoiseMs: number };
};

export type BrainAnchor = { position: THREE.Vector3; normal: THREE.Vector3 };

export const CLOUD_DEFAULTS = {
  /** Candidatos amostrados sobre a superfície antes do blue-noise. */
  candidates: 100_000,
  /** Distância mínima entre pontos aceitos (unidades de cena, maior extensão do cérebro = 3,8). */
  minDist: 0.03,
  seed: 41005,
  /** Peso mínimo de amostragem no fundo do sulco (a coroa pesa 1). */
  sulcusWeight: 0.3,
};

export function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 1 na coroa do giro, 0 no fundo do sulco, a partir do atributo contínuo `_SULC` (positivo = sulco). */
export function crownFromSulc(sulc: ArrayLike<number>): Float32Array {
  const n = sulc.length;
  const sorted = Float32Array.from(sulc as ArrayLike<number>).sort();
  const p10 = sorted[Math.floor(0.1 * (n - 1))];
  const p90 = sorted[Math.floor(0.9 * (n - 1))];
  const out = new Float32Array(n);
  const span = p90 - p10;
  // Cerebelo e tronco não trazem _SULC útil: valor neutro.
  if (!(span > 1e-6)) return out.fill(0.5);
  for (let i = 0; i < n; i++) out[i] = 1 - Math.min(1, Math.max(0, (sulc[i] - p10) / span));
  return out;
}

function sulcAttribute(geometry: THREE.BufferGeometry) {
  return geometry.getAttribute("_sulc") ?? geometry.getAttribute("_SULC");
}

/**
 * Partículas aderidas à superfície: MeshSurfaceSampler (peso pela coroa do giro, gerador com semente fixa)
 * seguido de blue-noise (dart throwing com distância mínima). Os pontos saem na ordem de aceitação, então
 * qualquer prefixo é uma amostra espalhada — o controle de densidade só muda o `drawRange`.
 */
export function buildCloud(geometries: NamedGeometry[], options: Partial<typeof CLOUD_DEFAULTS> = {}): BrainCloud {
  const o = { ...CLOUD_DEFAULTS, ...options };
  const rnd = mulberry32(o.seed);
  const t0 = performance.now();

  type Prepared = { sampler: MeshSurfaceSampler; weight: number };
  const prepared: Prepared[] = geometries.map(({ geometry }) => {
    const sulc = sulcAttribute(geometry);
    const crown = sulc ? crownFromSulc(sulc.array as Float32Array) : new Float32Array(geometry.getAttribute("position").count).fill(0.5);
    const work = new THREE.BufferGeometry();
    work.setAttribute("position", geometry.getAttribute("position"));
    work.setIndex(geometry.getIndex());
    const color = new Float32Array(crown.length * 3);
    const weight = new Float32Array(crown.length);
    for (let i = 0; i < crown.length; i++) {
      color[3 * i] = crown[i];
      weight[i] = o.sulcusWeight + (1 - o.sulcusWeight) * crown[i];
    }
    work.setAttribute("color", new THREE.BufferAttribute(color, 3));
    work.setAttribute("aw", new THREE.BufferAttribute(weight, 1));
    const sampler = new MeshSurfaceSampler(new THREE.Mesh(work)).setWeightAttribute("aw");
    // setRandomGenerator existe em runtime (three r186) mas falta nos tipos de @types/three 0.186.0.
    (sampler as unknown as { setRandomGenerator(f: () => number): void }).setRandomGenerator(rnd);
    sampler.build();
    const dist = sampler.distribution as Float32Array;
    return { sampler, weight: dist[dist.length - 1] };
  });
  const totalWeight = prepared.reduce((s, p) => s + p.weight, 0);

  const cand = new Float32Array(o.candidates * 3);
  const candCrown = new Float32Array(o.candidates);
  const p = new THREE.Vector3();
  const col = new THREE.Color();
  let k = 0;
  prepared.forEach((pr, idx) => {
    const quota = idx === prepared.length - 1 ? o.candidates - k : Math.round((o.candidates * pr.weight) / totalWeight);
    for (let i = 0; i < quota && k < o.candidates; i++, k++) {
      pr.sampler.sample(p, undefined, col);
      cand[3 * k] = p.x;
      cand[3 * k + 1] = p.y;
      cand[3 * k + 2] = p.z;
      candCrown[k] = col.r;
    }
  });
  const sampleMs = performance.now() - t0;

  // Blue-noise: ordem embaralhada com a mesma semente; um ponto entra se nenhum aceito estiver a menos de minDist.
  const t1 = performance.now();
  const order = Int32Array.from({ length: k }, (_, i) => i);
  for (let i = k - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = order[i];
    order[i] = order[j];
    order[j] = t;
  }
  const inv = 1 / o.minDist;
  const r2 = o.minDist * o.minDist;
  const grid = new Map<number, number[]>();
  const key = (x: number, y: number, z: number) => ((x + 512) * 1024 + (y + 512)) * 1024 + (z + 512);
  const kept: number[] = [];
  for (const i of order) {
    const x = cand[3 * i], y = cand[3 * i + 1], z = cand[3 * i + 2];
    const cx = Math.floor(x * inv), cy = Math.floor(y * inv), cz = Math.floor(z * inv);
    let ok = true;
    for (let dx = -1; dx <= 1 && ok; dx++)
      for (let dy = -1; dy <= 1 && ok; dy++)
        for (let dz = -1; dz <= 1 && ok; dz++) {
          const cell = grid.get(key(cx + dx, cy + dy, cz + dz));
          if (!cell) continue;
          for (const j of cell) {
            const ex = cand[3 * j] - x, ey = cand[3 * j + 1] - y, ez = cand[3 * j + 2] - z;
            if (ex * ex + ey * ey + ez * ez < r2) { ok = false; break; }
          }
        }
    if (!ok) continue;
    kept.push(i);
    const kk = key(cx, cy, cz);
    const cell = grid.get(kk);
    if (cell) cell.push(i); else grid.set(kk, [i]);
  }
  const blueNoiseMs = performance.now() - t1;

  const positions = new Float32Array(kept.length * 3);
  const crown = new Float32Array(kept.length);
  const centroid = new THREE.Vector3();
  kept.forEach((src, i) => {
    positions[3 * i] = cand[3 * src];
    positions[3 * i + 1] = cand[3 * src + 1];
    positions[3 * i + 2] = cand[3 * src + 2];
    crown[i] = candCrown[src];
    centroid.x += positions[3 * i]; centroid.y += positions[3 * i + 1]; centroid.z += positions[3 * i + 2];
  });
  centroid.divideScalar(kept.length);
  let radius = 0;
  for (let i = 0; i < kept.length; i++)
    radius = Math.max(radius, Math.hypot(positions[3 * i] - centroid.x, positions[3 * i + 1] - centroid.y, positions[3 * i + 2] - centroid.z));

  return { positions, crown, centroid, radius, count: kept.length, timings: { sampleMs, blueNoiseMs } };
}

/** Vértice mais externo do córtex numa direção (espaço do objeto) + sua normal. Mesma regra de `brain-hollow.js`. */
export function anchorOnCortex(cortex: NamedGeometry[], dir: [number, number, number]): BrainAnchor {
  const d = new THREE.Vector3(...dir).normalize();
  let best = -Infinity;
  let hit: { pos: THREE.BufferAttribute; nrm: THREE.BufferAttribute; i: number } | null = null;
  for (const { geometry } of cortex) {
    const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
    const nrm = geometry.getAttribute("normal") as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const sc = pos.getX(i) * d.x + pos.getY(i) * d.y + pos.getZ(i) * d.z;
      if (sc > best) { best = sc; hit = { pos, nrm, i }; }
    }
  }
  if (!hit) throw new Error("anchorOnCortex: sem córtex");
  return {
    position: new THREE.Vector3(hit.pos.getX(hit.i), hit.pos.getY(hit.i), hit.pos.getZ(hit.i)),
    normal: new THREE.Vector3(hit.nrm.getX(hit.i), hit.nrm.getY(hit.i), hit.nrm.getZ(hit.i)).normalize(),
  };
}

/** Distância da câmera para que o diâmetro da esfera justa ocupe a fração `k` da largura (perspectiva, fov vertical). */
export function distanceFor(radius: number, k: number, aspect: number, fovDeg: number) {
  const tanV = Math.tan(THREE.MathUtils.degToRad(fovDeg / 2));
  return radius / Math.sin(Math.atan(k * tanV * aspect));
}

/** Fração da largura do canvas ocupada pelos pontos, com a rotação em y e a inclinação dadas (câmera em +z). */
export function projectedWidth(cloud: BrainCloud, camDist: number, aspect: number, fovDeg: number, rotY: number, tilt: number) {
  const cam = new THREE.PerspectiveCamera(fovDeg, aspect, 0.01, 100);
  cam.position.set(0, 0, camDist);
  cam.lookAt(0, 0, 0);
  cam.updateMatrixWorld(true);
  cam.updateProjectionMatrix();
  const m = new THREE.Matrix4()
    .makeRotationFromEuler(new THREE.Euler(tilt, rotY, 0))
    .multiply(new THREE.Matrix4().makeTranslation(-cloud.centroid.x, -cloud.centroid.y, -cloud.centroid.z));
  const v = new THREE.Vector3();
  let lo = Infinity, hi = -Infinity;
  const p = cloud.positions;
  for (let i = 0; i < p.length; i += 3) {
    v.set(p[i], p[i + 1], p[i + 2]).applyMatrix4(m).project(cam);
    if (v.x < lo) lo = v.x;
    if (v.x > hi) hi = v.x;
  }
  return (hi - lo) / 2;
}

/** Resolve k tal que a vista lateral ocupe `target` da largura. Independe do aspecto do palco. */
export function solveFraming(cloud: BrainCloud, target: number, fovDeg: number, lateralRotY: number, tilt: number) {
  let k = 0.9;
  for (let it = 0; it < 5; it++) {
    const w = projectedWidth(cloud, distanceFor(cloud.radius, k, 1, fovDeg), 1, fovDeg, lateralRotY, tilt);
    k *= target / w;
  }
  return k;
}
