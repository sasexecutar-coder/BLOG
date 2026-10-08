// Cena do cérebro da home (HOME-BRAIN-001): nuvem de pontos do OpenNeuro ds006128 (CC0, ver
// public/models/home-brain/manifest.json), rotação sob demanda, arraste e ciclo de vida completo.
import * as THREE from "three";

import type { BrainController } from "./types";

const POINTS_URL = "/models/home-brain/brain-points.bin";
/** Vista inicial: lateral direita, frente para a direita, levemente de cima (x = anterior, y = superior, z = direita). */
const INITIAL_ROTATION = new THREE.Euler(0.18, -0.38, 0);

/** Called only after hydration. Owns and releases every listener, frame and GPU resource. */
export async function createBrainRenderer(
  canvas: HTMLCanvasElement,
  options: {
    signal: AbortSignal;
    paused: boolean;
    onDrag: () => void;
    onError: () => void;
  },
): Promise<BrainController> {
  const response = await fetch(POINTS_URL, { signal: options.signal });
  if (!response.ok) throw new Error(`Brain asset: ${response.status}`);
  const bytes = await response.arrayBuffer();
  if (options.signal.aborted) throw new DOMException("Aborted", "AbortError");
  // Int16 x, y, z por ponto (manifest.json: value / 32767 · 2).
  if (!bytes.byteLength || bytes.byteLength % 6) throw new Error("Invalid brain point asset");
  const raw = new Int16Array(bytes);
  const positions = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) positions[i] = (raw[i] / 32767) * 2;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 30);
  camera.position.set(0, 0.15, 6.1);
  const brain = new THREE.Group();
  brain.rotation.copy(INITIAL_ROTATION);
  scene.add(brain);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3),
  );
  // Fine particles keep the sulci visible without turning the specimen into a solid orange mass.
  const material = new THREE.PointsMaterial({
    size: 0.014,
    transparent: true,
    opacity: 0.78,
    depthWrite: false,
    alphaTest: 0.5,
    sizeAttenuation: true,
  });
  // Round particles, generated in memory; no texture request or third-party dependency.
  const dot = document.createElement("canvas");
  dot.width = dot.height = 32;
  const context = dot.getContext("2d")!;
  context.fillStyle = "white";
  context.beginPath();
  context.arc(16, 16, 14, 0, Math.PI * 2);
  context.fill();
  const texture = new THREE.CanvasTexture(dot);
  material.map = texture;
  const points = new THREE.Points(geometry, material);
  brain.add(points);
  let disposed = false,
    paused = options.paused,
    intersecting = true,
    frame = 0,
    last = 0,
    rendered = 0;
  let pointer: { id: number; x: number; y: number; type: string } | undefined;
  const host = canvas.parentElement!;
  const clearFrame = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    last = 0;
  };
  const moving = () => !paused && intersecting && !document.hidden && !pointer;
  const draw = (timestamp = 0) => {
    frame = 0;
    if (disposed) return;
    if (moving() && last)
      brain.rotation.y += Math.min((timestamp - last) / 1000, 0.05) * 0.12;
    last = timestamp;
    renderer.render(scene, camera);
    canvas.dataset.angle = brain.rotation.y.toFixed(4);
    canvas.dataset.frames = String(++rendered);
    canvas.dataset.motion = moving() ? "rotating" : "paused";
    if (moving()) frame = requestAnimationFrame(draw);
  };
  const invalidate = () => {
    if (!disposed && !frame) frame = requestAnimationFrame(draw);
  };
  // Tokens CSS podem vir em oklch (tema escuro); o canvas 2D converte qualquer cor CSS para RGB.
  const probe = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
  const resolve = (value: string, target: THREE.Color) => {
    probe.clearRect(0, 0, 1, 1);
    probe.fillStyle = value;
    probe.fillRect(0, 0, 1, 1);
    const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
    target.setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
  };
  // Profundidade como na retícula do globo: os pontos do lado de trás se dissolvem na cor do fundo.
  const fog = new THREE.Fog(0xffffff, 1, 10);
  scene.fog = fog;
  const colors = () => {
    const css = getComputedStyle(host);
    resolve(css.getPropertyValue("--brain-particle").trim() || "orangered", material.color);
    resolve(css.getPropertyValue("--background").trim() || "white", fog.color);
    invalidate();
  };
  const resize = () => {
    const { width, height } = host.getBoundingClientRect();
    if (!width || !height || disposed) return;
    renderer.setPixelRatio(
      Math.min(devicePixelRatio || 1, width < 600 ? 1.5 : 2),
    );
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Fit the specimen by its widest dimension. A portrait viewport has much less
    // horizontal space than vertical space; fitting only the height clips the cortex.
    const halfWidth = 2.0;
    const horizontalFill = width < 620 ? 0.62 : 0.88;
    const horizontalDistance = halfWidth / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect * horizontalFill);
    camera.position.z = Math.max(6.1, horizontalDistance);
    camera.updateProjectionMatrix();
    fog.near = camera.position.z - 1.4;
    fog.far = camera.position.z + 2.6;
    invalidate();
  };
  const pointerDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button !== 0) return;
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      type: event.pointerType,
    };
    canvas.setPointerCapture(event.pointerId);
    paused = true;
    options.onDrag();
    clearFrame();
    invalidate();
  };
  const pointerMove = (event: PointerEvent) => {
    if (!pointer || pointer.id !== event.pointerId) return;
    brain.rotation.y += (event.clientX - pointer.x) * 0.008;
    if (pointer.type !== "touch")
      brain.rotation.x = THREE.MathUtils.clamp(
        brain.rotation.x + (event.clientY - pointer.y) * 0.004,
        -0.6,
        0.6,
      );
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    invalidate();
  };
  const pointerEnd = () => {
    pointer = undefined;
    invalidate();
  };
  const visibility = () => {
    clearFrame();
    if (!document.hidden && intersecting) invalidate();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    clearFrame();
    options.onError();
  };
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    intersecting = entry.isIntersecting;
    visibility();
  });
  intersectionObserver.observe(host);
  const themeObserver = new MutationObserver(colors);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  canvas.addEventListener("pointerdown", pointerDown);
  canvas.addEventListener("pointermove", pointerMove);
  canvas.addEventListener("pointerup", pointerEnd);
  canvas.addEventListener("pointercancel", pointerEnd);
  canvas.addEventListener("lostpointercapture", pointerEnd);
  canvas.addEventListener("webglcontextlost", contextLost);
  document.addEventListener("visibilitychange", visibility);
  colors();
  resize();
  const controller: BrainController = {
    setPaused(value) {
      paused = value;
      clearFrame();
      invalidate();
    },
    rotate(direction) {
      paused = true;
      brain.rotation.y += (direction * Math.PI) / 8;
      clearFrame();
      invalidate();
    },
    reset() {
      brain.rotation.copy(INITIAL_ROTATION);
      invalidate();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      clearFrame();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("pointerdown", pointerDown);
      canvas.removeEventListener("pointermove", pointerMove);
      canvas.removeEventListener("pointerup", pointerEnd);
      canvas.removeEventListener("pointercancel", pointerEnd);
      canvas.removeEventListener("lostpointercapture", pointerEnd);
      canvas.removeEventListener("webglcontextlost", contextLost);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  return controller;
}
