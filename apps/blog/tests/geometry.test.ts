// Testes da geometria do cérebro (Node ≥ 22.6: node --experimental-strip-types --test tests/*.test.ts)
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { anchorOnCortex, buildCloud, CLOUD_DEFAULTS, solveFraming, projectedWidth, distanceFor } from "../app/features/brain/brainGeometry.ts";

const glbUrl = new URL("../public/models/home-brain/brain-surface.glb", import.meta.url);

async function load() {
  const buf = await readFile(glbUrl);
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  const gltf: any = await new Promise((res, rej) => new GLTFLoader().parse(ab, "", res, rej));
  const geos: { name: string; geometry: THREE.BufferGeometry }[] = [];
  gltf.scene.traverse((o: any) => o.isMesh && geos.push({ name: o.name, geometry: o.geometry }));
  return geos;
}

test("GLB: 4 malhas triangulares com _sulc", async () => {
  const geos = await load();
  assert.deepEqual(geos.map((g) => g.name).sort(), ["brain-stem", "cerebellum", "cortex-left", "cortex-right"]);
  const tris = geos.reduce((s, g) => s + g.geometry.getIndex()!.count / 3, 0);
  assert.equal(tris, 350236);
  for (const g of geos) assert.ok(g.geometry.getAttribute("_sulc"), `${g.name} sem _sulc`);
});

test("nuvem: determinística, blue-noise respeitado e com giros", async () => {
  const geos = await load();
  const a = buildCloud(geos);
  const b = buildCloud(geos);
  assert.equal(a.count, b.count);
  assert.deepEqual(Array.from(a.positions.slice(0, 30)), Array.from(b.positions.slice(0, 30)));
  console.log("pontos aceitos", a.count, "R", a.radius.toFixed(3), a.timings);
  // distância mínima (amostra de 2000 pares vizinhos por força bruta num subconjunto)
  let min = Infinity;
  const n = 1500;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    const d = Math.hypot(a.positions[3*i]-a.positions[3*j], a.positions[3*i+1]-a.positions[3*j+1], a.positions[3*i+2]-a.positions[3*j+2]);
    if (d < min) min = d;
  }
  assert.ok(min >= CLOUD_DEFAULTS.minDist - 1e-6, `min ${min}`);
  const mean = a.crown.reduce((s, v) => s + v, 0) / a.count;
  const hi = a.crown.filter((v) => v > 0.66).length / a.count;
  const lo = a.crown.filter((v) => v < 0.33).length / a.count;
  console.log("crown média", mean.toFixed(3), ">0.66:", hi.toFixed(3), "<0.33:", lo.toFixed(3));
  assert.ok(a.count >= 20000, "densidade máxima insuficiente: " + a.count);
  assert.ok(hi > lo, "coroas devem predominar sobre sulcos");
});

test("enquadramento: vista lateral ≈ 78% da largura", async () => {
  const geos = await load();
  const cloud = buildCloud(geos);
  const lateral = -0.38 - 0; // VIEWS['lateral-right'] = [0.08, 0]; usamos rotY 0 e tilt 0.08
  const k = solveFraming(cloud, 0.78, 30, 0, 0.08);
  const w = projectedWidth(cloud, distanceFor(cloud.radius, k, 1, 30), 1, 30, 0, 0.08);
  console.log("k", k.toFixed(4), "largura lateral", (w * 100).toFixed(2) + "%");
  assert.ok(Math.abs(w - 0.78) < 0.005);
  void lateral;
});

test("âncoras: 4 direções, pontos no córtex", async () => {
  const geos = await load();
  const cortex = geos.filter((g) => g.name.startsWith("cortex"));
  for (const dir of [[1, 0.3, 0.1], [0.1, 0.4, 1], [-1, 0.3, 0.1], [0.1, 0.4, -1]] as [number, number, number][]) {
    const a = anchorOnCortex(cortex, dir);
    assert.ok(a.position.length() > 0.5);
    assert.ok(Math.abs(a.normal.length() - 1) < 1e-3);
  }
});
