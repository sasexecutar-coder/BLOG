// Constantes e tipos leves compartilhados entre a casca (SSR) e a cena 3D. Sem importar three/R3F, para que o
// pacote da página e o Worker não carreguem o 3D: BrainCanvas só entra por import() depois da hidratação.
import { BRAIN_FUNCTIONS } from "./brainNetworks.data";

export const GLB_URL = "/models/home-brain/brain-surface.glb";
export const FOV = 30;
export const LATERAL_WIDTH = 0.78;
export const STAGE_HEIGHT = 1.1;
export const TILT = 0.08;
export const ANGLES = { lateral: 0, posterior: Math.PI / 2, frontal: -Math.PI / 2 } as const;

export type ViewMode = 0 | 1 | 2; // 0 visão geral · 1 função selecionada · 2 rede destacada

export type MarkerState = { x: number; y: number; facing: number };

/** Estado mutável compartilhado com o DOM (marcadores e painel de debug). Escrito a cada quadro, sem re-render. */
export type BrainRuntime = {
  markers: MarkerState[];
  camDist: number;
  widthPct: number;
  points: number;
  available: number;
  init: { totalMs: number; sampleMs: number; blueNoiseMs: number } | null;
  rotYDeg: number;
  size: [number, number];
  onFrame?: (r: BrainRuntime) => void;
};
export const makeRuntime = (): BrainRuntime => ({
  markers: BRAIN_FUNCTIONS.map(() => ({ x: 0, y: 0, facing: -1 })),
  camDist: 0, widthPct: 0, points: 0, available: 0, init: null, rotYDeg: 0, size: [0, 0],
});

/** `focus`: ângulo (rad) para o qual a cena deve girar suavemente (null = nenhum). */
export type BrainControl = { paused: boolean; nudge: number; reset: boolean; focus: number | null };
export type BrainReady = { aspect: number; available: number };
