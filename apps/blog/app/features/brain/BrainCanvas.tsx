// HOME-BRAIN-001 — cena 3D (React Three Fiber). Carregada só no cliente, depois da hidratação (ver BrainNetworkMap).
// Camadas, em ordem de desenho:
//   -2 oclusor (só profundidade)  -1.5 brilho  -1 aro  0 malha translúcida  1 conexões  2 pontos (sem teste de profundidade)
// O aro e o brilho são cascas deslocadas ao longo da normal, desenhadas só onde o oclusor não cobre: aparecem fora da silhueta.
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { BRAIN_FUNCTIONS, anchorDirection } from "./brainNetworks.data";
import { type BrainAnchor, type BrainCloud, anchorOnCortex, buildCloud, crownFromSulc, distanceFor, projectedWidth, solveFraming } from "./brainGeometry";
import type { BrainParams } from "./brainTheme";
import { ANGLES, FOV, GLB_URL, LATERAL_WIDTH, STAGE_HEIGHT, TILT, type BrainControl, type BrainReady, type BrainRuntime, type ViewMode } from "./brainRuntime";

// ── shaders ────────────────────────────────────────────────────────────────
const DEPTH = `uniform float uCam; uniform float uR;
float backOf(vec4 mv) { return clamp((-mv.z - (uCam - uR)) / (2.0 * uR), 0.0, 1.0); }`;

const POINT_VS = `${DEPTH}
attribute float aCrown; uniform float uSize; uniform float uSmall; uniform float uDpr;
uniform vec3 uAnch[4]; uniform float uSel; uniform float uMode; uniform float uRadius;
varying float vBack; varying float vCrown; varying float vAct;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vBack = backOf(mv); vCrown = aCrown;
  float act = 0.0;
  if (uMode > 0.5) {
    for (int i = 0; i < 4; i++) {
      bool isSel = abs(float(i) - uSel) < 0.5;
      if (uMode < 1.5 && !isSel) continue;
      float r = isSel ? uRadius * (uMode > 1.5 ? 1.35 : 1.0) : uRadius * 0.8;
      float w = isSel ? 1.0 : 0.6;
      act = max(act, (1.0 - smoothstep(r * 0.5, r, distance(position, uAnch[i]))) * w);
    }
  }
  vAct = act;
  gl_PointSize = uSize * mix(uSmall, 1.0, smoothstep(0.2, 0.9, aCrown)) * (1.0 + 0.5 * act) * uDpr * (uCam / -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const POINT_FS = `uniform vec3 uPrim; uniform vec3 uSec; uniform vec3 uAct; uniform float uFront; uniform float uBackA;
varying float vBack; varying float vCrown; varying float vAct;
void main() {
  float d = 1.0 - smoothstep(0.3, 0.5, length(gl_PointCoord - 0.5)); if (d < 0.01) discard;
  vec3 base = mix(uSec, uPrim, smoothstep(0.25, 0.85, vCrown));
  float a = mix(uFront, uBackA, smoothstep(0.35, 0.65, vBack));
  a = mix(a, max(a, uFront), vAct);
  gl_FragColor = vec4(mix(base, uAct, vAct), a * d);
#include <colorspace_fragment>
}`;

const MESH_VS = `attribute float aCrown; varying vec3 vN; varying float vCrown;
void main() { vN = normalize(normalMatrix * normal); vCrown = aCrown; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const MESH_FS = `uniform vec3 uMesh; uniform float uA; varying vec3 vN; varying float vCrown;
void main() {
  float l = 0.35 + 0.65 * max(dot(normalize(vN), normalize(vec3(-0.4, 0.6, 0.7))), 0.0);
  gl_FragColor = vec4(uMesh, uA * l * (0.45 + 0.55 * vCrown));
#include <colorspace_fragment>
}`;
const SHELL_VS = `uniform float uOffset; void main() { vec3 p = position + normalize(normal) * uOffset; gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0); }`;
const FLAT_FS = `uniform vec3 uColor; uniform float uA; void main() { gl_FragColor = vec4(uColor, uA);
#include <colorspace_fragment>
}`;
const OCC_FS = `void main() { gl_FragColor = vec4(1.0); }`;

type Pack = { name: string; geometry: THREE.BufferGeometry };

function Scene(props: {
  params: BrainParams; selected: number; mode: ViewMode; control: React.MutableRefObject<BrainControl>;
  runtime: React.MutableRefObject<BrainRuntime>; debug: boolean; startAngle: number; freeze: boolean; reducedMotion: boolean;
  onReady: (r: BrainReady) => void; resumeMs?: number;
}) {
  const { params, selected, mode, control, runtime, debug, startAngle, freeze, reducedMotion, onReady, resumeMs = 3000 } = props;
  const { camera, size, gl, invalidate } = useThree();
  const gltf = useGLTF(GLB_URL);
  const t0 = useRef(performance.now());

  const built = useMemo(() => {
    const t = performance.now();
    const meshes: Pack[] = [];
    gltf.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        const sulc = m.geometry.getAttribute("_sulc");
        const crown = sulc ? crownFromSulc(sulc.array as Float32Array) : new Float32Array(m.geometry.getAttribute("position").count).fill(0.5);
        m.geometry.setAttribute("aCrown", new THREE.BufferAttribute(crown, 1));
        meshes.push({ name: m.name, geometry: m.geometry });
      }
    });
    const cloud: BrainCloud = buildCloud(meshes);
    const cortex = meshes.filter((m) => m.name.startsWith("cortex"));
    const anchors: BrainAnchor[] = BRAIN_FUNCTIONS.map((f) => anchorOnCortex(cortex, anchorDirection(f)));
    const k = solveFraming(cloud, LATERAL_WIDTH, FOV, ANGLES.lateral, TILT);
    return { meshes, cloud, anchors, k, buildMs: performance.now() - t };
  }, [gltf]);
  const { meshes, cloud, anchors, k } = built;

  // geometria dos pontos
  const pointGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(cloud.positions, 3));
    g.setAttribute("aCrown", new THREE.BufferAttribute(cloud.crown, 1));
    return g;
  }, [cloud]);

  const shared = useMemo(() => ({ uCam: { value: 10 }, uR: { value: cloud.radius } }), [cloud.radius]);
  const pointU = useMemo(() => ({
    ...shared, uSize: { value: 1 }, uSmall: { value: 0.6 }, uDpr: { value: 1 },
    uAnch: { value: anchors.map((a) => a.position.clone()) }, uSel: { value: -1 }, uMode: { value: 0 }, uRadius: { value: 0.7 },
    uPrim: { value: new THREE.Color() }, uSec: { value: new THREE.Color() }, uAct: { value: new THREE.Color() }, uFront: { value: 0.8 }, uBackA: { value: 0.2 },
  }), [shared, anchors]);
  const meshU = useMemo(() => ({ uMesh: { value: new THREE.Color() }, uA: { value: 0.09 } }), []);
  const occU = useMemo(() => ({ uOffset: { value: 0 } }), []);
  const rimU = useMemo(() => ({ uOffset: { value: 0 }, uColor: { value: new THREE.Color() }, uA: { value: 1 } }), []);
  const glowU = useMemo(() => ({ uOffset: { value: 0 }, uColor: { value: new THREE.Color() }, uA: { value: 0.12 } }), []);

  const pivot = useRef<THREE.Group>(null);
  const content = useRef<THREE.Group>(null);

  // arcos de conexão (rede destacada): da âncora selecionada às outras, arqueados para fora
  const arcs = useMemo(() => anchors.map((a, i) => anchors.map((b, j) => {
    if (i === j) return null;
    const mid = a.position.clone().add(b.position).multiplyScalar(0.5);
    const ctrl = mid.clone().sub(cloud.centroid).normalize().multiplyScalar(mid.clone().sub(cloud.centroid).length() + cloud.radius * 0.55).add(cloud.centroid);
    const pts = new THREE.QuadraticBezierCurve3(a.position, ctrl, b.position).getPoints(64);
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({ transparent: true, depthTest: false, depthWrite: false });
    const line = new THREE.Line(geo, mat); line.renderOrder = 1;
    return line;
  })), [anchors, cloud]);
  useEffect(() => () => arcs.flat().forEach((l) => { l?.geometry.dispose(); (l?.material as THREE.Material | undefined)?.dispose(); }), [arcs]);
  useEffect(() => () => pointGeo.dispose(), [pointGeo]);

  // pronto: devolve a proporção do palco (altura = 1,1 × diâmetro da esfera justa) e a densidade máxima
  useEffect(() => {
    runtime.current.available = cloud.count;
    runtime.current.init = { totalMs: built.buildMs, sampleMs: cloud.timings.sampleMs, blueNoiseMs: cloud.timings.blueNoiseMs };
    onReady({ aspect: 1 / (STAGE_HEIGHT * k), available: cloud.count });
  }, [cloud, built.buildMs, k, onReady, runtime]);

  // rotação
  const rot = useRef({ y: startAngle, dragging: false, lastX: 0, released: -Infinity });
  useEffect(() => { rot.current.y = startAngle; invalidate(); }, [startAngle, invalidate]);
  useEffect(() => {
    const el = gl.domElement;
    el.style.touchAction = "pan-y";
    if (freeze) return;
    el.style.cursor = "grab";
    const down = (e: PointerEvent) => { rot.current.dragging = true; rot.current.lastX = e.clientX; el.setPointerCapture(e.pointerId); el.style.cursor = "grabbing"; };
    const move = (e: PointerEvent) => {
      if (!rot.current.dragging) return;
      rot.current.y += ((e.clientX - rot.current.lastX) / el.clientWidth) * 0.5 * Math.PI * 2;
      rot.current.lastX = e.clientX; invalidate();
    };
    const up = () => { if (!rot.current.dragging) return; rot.current.dragging = false; rot.current.released = performance.now(); el.style.cursor = "grab"; };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up); el.addEventListener("lostpointercapture", up);
    return () => {
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("lostpointercapture", up);
    };
  }, [gl, freeze, invalidate]);

  const tmp = useMemo(() => ({ v: new THREE.Vector3(), n: new THREE.Vector3(), view: new THREE.Vector3() }), []);
  const lastSize = useRef<[number, number]>([0, 0]);
  const frame = useRef(0);

  useFrame((_, delta) => {
    const p = params;
    const aspect = size.width / size.height;
    const dist = distanceFor(cloud.radius, k, aspect, FOV);
    const cam = camera as THREE.PerspectiveCamera;
    if (lastSize.current[0] !== size.width || lastSize.current[1] !== size.height || Math.abs(cam.position.z - dist) > 1e-4) {
      lastSize.current = [size.width, size.height];
      cam.position.set(0, 0, dist); cam.lookAt(0, 0, 0);
      cam.near = Math.max(0.01, dist - cloud.radius * 1.5); cam.far = dist + cloud.radius * 1.5; cam.updateProjectionMatrix();
    }
    const camDist = cam.position.length();
    const worldPerPx = (2 * camDist * Math.tan(THREE.MathUtils.degToRad(FOV / 2))) / size.height;

    // controles textuais
    const c = control.current;
    if (c.reset) { rot.current.y = startAngle; c.reset = false; }
    if (c.nudge) { rot.current.y += c.nudge; c.nudge = 0; }
    // foco: gira pelo caminho mais curto até o ângulo pedido (sem animação com movimento reduzido)
    if (c.focus !== null && !freeze) {
      const d = Math.atan2(Math.sin(c.focus - rot.current.y), Math.cos(c.focus - rot.current.y));
      if (reducedMotion || Math.abs(d) < 0.002) { rot.current.y += d; c.focus = null; }
      else rot.current.y += d * (1 - Math.exp(-6 * Math.min(delta, 0.1)));
      invalidate();
    }
    const auto = !freeze && !reducedMotion && !c.paused && p.turnSeconds > 0 && !rot.current.dragging && performance.now() - rot.current.released > resumeMs;
    if (auto) rot.current.y += (delta * Math.PI * 2) / p.turnSeconds;
    if (pivot.current) pivot.current.rotation.set(TILT, rot.current.y, 0);

    // uniforms
    shared.uCam.value = camDist;
    const dpr = gl.getPixelRatio();
    pointU.uDpr.value = dpr; pointU.uSize.value = p.dotSize; pointU.uSmall.value = p.dotSmallRatio;
    pointU.uPrim.value.set(p.dotPrimary); pointU.uSec.value.set(p.dotSecondary); pointU.uAct.value.set(p.active);
    pointU.uFront.value = p.frontOpacity; pointU.uBackA.value = p.backOpacity;
    pointU.uSel.value = selected; pointU.uMode.value = selected < 0 ? 0 : mode; pointU.uRadius.value = cloud.radius * 0.38;
    meshU.uMesh.value.set(p.mesh); meshU.uA.value = p.meshOpacity;
    occU.uOffset.value = -0.6 * worldPerPx;
    rimU.uOffset.value = p.rimWidth * worldPerPx; rimU.uColor.value.set(p.rim); rimU.uA.value = p.rimWidth > 0 ? 0.9 : 0;
    glowU.uOffset.value = (p.rimWidth + p.glowWidth) * worldPerPx; glowU.uColor.value.set(p.rim); glowU.uA.value = p.glowWidth > 0 ? p.glowOpacity : 0;
    pgeoDraw(pointGeo, Math.min(p.count, cloud.count));

    // arcos
    arcs.forEach((row, i) => row.forEach((line) => {
      if (!line) return;
      const on = mode === 2 && selected === i;
      line.visible = on;
      if (on) { const m = line.material as THREE.LineBasicMaterial; m.color.set(p.connection); m.opacity = 0.85; }
    }));

    // marcadores: projeção por quadro (px CSS dentro do palco) e orientação em relação à câmera
    const root = content.current; const piv = pivot.current;
    if (root && piv) {
      piv.updateMatrixWorld(true); cam.updateMatrixWorld(true);
      anchors.forEach((a, i) => {
        tmp.v.copy(a.position).addScaledVector(a.normal, 0.03); root.localToWorld(tmp.v);
        tmp.n.copy(a.normal).transformDirection(root.matrixWorld);
        tmp.view.copy(cam.position).sub(tmp.v).normalize();
        const facing = tmp.n.dot(tmp.view);
        tmp.v.project(cam);
        const m = runtime.current.markers[i];
        m.x = (tmp.v.x * 0.5 + 0.5) * size.width; m.y = (-tmp.v.y * 0.5 + 0.5) * size.height; m.facing = facing;
      });
    }
    const r = runtime.current;
    r.camDist = camDist; r.points = Math.min(p.count, cloud.count); r.size = [size.width, size.height];
    r.rotYDeg = ((THREE.MathUtils.radToDeg(rot.current.y) % 360) + 360) % 360;
    if (debug && frame.current++ % 12 === 0) r.widthPct = projectedWidth(cloud, camDist, aspect, FOV, rot.current.y, TILT) * 100;
    r.onFrame?.(r);
  });

  // pede um quadro quando os parâmetros mudam (frameloop sob demanda)
  useEffect(() => { invalidate(); }, [params, selected, mode, invalidate]);

  const additive = params.additive ? THREE.AdditiveBlending : THREE.NormalBlending;

  return (
    <>
      <color attach="background" args={[params.bg]} />
      <group ref={pivot}>
        <group ref={content} position={[-cloud.centroid.x, -cloud.centroid.y, -cloud.centroid.z]}>
          {meshes.map((m) => (
            <group key={m.name}>
              <mesh geometry={m.geometry} renderOrder={-2}>
                <shaderMaterial uniforms={occU} vertexShader={SHELL_VS} fragmentShader={OCC_FS} colorWrite={false} depthWrite />
              </mesh>
              <mesh geometry={m.geometry} renderOrder={-1.5} visible={params.glowWidth > 0 && params.glowOpacity > 0}>
                <shaderMaterial uniforms={glowU} vertexShader={SHELL_VS} fragmentShader={FLAT_FS} side={THREE.BackSide} transparent depthWrite={false} />
              </mesh>
              <mesh geometry={m.geometry} renderOrder={-1} visible={params.rimWidth > 0}>
                <shaderMaterial uniforms={rimU} vertexShader={SHELL_VS} fragmentShader={FLAT_FS} side={THREE.BackSide} transparent depthWrite={false} />
              </mesh>
              <mesh geometry={m.geometry} renderOrder={0}>
                <shaderMaterial uniforms={meshU} vertexShader={MESH_VS} fragmentShader={MESH_FS} transparent depthWrite={false} />
              </mesh>
            </group>
          ))}
          {arcs.flat().map((l, i) => (l ? <primitive key={i} object={l} /> : null))}
          <points geometry={pointGeo} renderOrder={2} frustumCulled={false}>
            <shaderMaterial uniforms={pointU} vertexShader={POINT_VS} fragmentShader={POINT_FS} transparent depthTest={false} depthWrite={false} blending={additive} />
          </points>
        </group>
      </group>
    </>
  );
}

function pgeoDraw(g: THREE.BufferGeometry, count: number) {
  if (g.drawRange.count !== count) g.setDrawRange(0, count);
}

export default function BrainCanvas(props: Parameters<typeof Scene>[0] & { frameloop: "always" | "demand" | "never" }) {
  const { frameloop, ...rest } = props;
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 3]}
      flat
      camera={{ fov: FOV, position: [0, 0, 10], near: 0.01, far: 100 }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance", preserveDrawingBuffer: rest.debug }}
      style={{ width: "100%", height: "100%", display: "block" }}
      aria-hidden="true"
    >
      <Scene {...rest} />
    </Canvas>
  );
}
