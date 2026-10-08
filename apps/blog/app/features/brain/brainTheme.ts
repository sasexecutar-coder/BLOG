// HOME-BRAIN-001 — tema do cérebro: presets, esquema dos controles, serialização na URL e contraste WCAG.
// Os presets Nocturne repetem os valores de tokens de `design-system/nocturne/styles.css` (nome do token no comentário);
// `scripts/check-presets.mjs` falha se algum deles divergir do CSS. Os valores livres (hex) são o ponto do painel
// "Ajustar visual": o usuário tem controle total, e o Nocturne continua sendo a fonte de verdade do restante da interface.

export type BrainParams = {
  // cores (hex #rrggbb)
  bg: string;
  panel: string;
  text: string;
  dotPrimary: string;
  dotSecondary: string;
  mesh: string;
  active: string;
  connection: string;
  rim: string;
  // números
  dotSize: number; // px CSS do ponto primário, na distância de enquadramento
  dotSmallRatio: number; // tamanho do ponto secundário / primário
  count: number; // pontos desenhados
  frontOpacity: number;
  backOpacity: number;
  meshOpacity: number;
  rimWidth: number; // px
  glowWidth: number; // px
  glowOpacity: number;
  additive: boolean; // blending aditivo (fundo escuro)
  turnSeconds: number; // segundos por volta; 0 = parado
};

export type PresetId = "nocturne-laranja" | "nocturne-puro" | "cloudflare-claro";

const NUMBERS: Omit<BrainParams, "bg" | "panel" | "text" | "dotPrimary" | "dotSecondary" | "mesh" | "active" | "connection" | "rim" | "additive"> = {
  dotSize: 1.1,
  dotSmallRatio: 0.6,
  count: 18000,
  frontOpacity: 0.82,
  backOpacity: 0.24,
  meshOpacity: 0.09,
  rimWidth: 1,
  glowWidth: 6,
  glowOpacity: 0.12,
  turnSeconds: 55,
};

export const PRESETS: Record<PresetId, { label: string; params: BrainParams }> = {
  "nocturne-laranja": {
    label: "Nocturne + laranja ativo",
    params: {
      ...NUMBERS,
      bg: "#161826", // --color-bg
      panel: "#232532", // --color-surface
      text: "#e9e9ed", // --color-text
      dotPrimary: "#b5abfc", // --color-accent-400
      dotSecondary: "#5d5294", // --color-accent-700
      mesh: "#968ae0", // --color-accent-500
      active: "#f56a1c", // laranja de seleção (fora do Nocturne; decisão D-001, adendo)
      connection: "#f56a1c",
      rim: "#5d5294", // --color-accent-700
      additive: true,
    },
  },
  "nocturne-puro": {
    label: "Nocturne puro",
    params: {
      ...NUMBERS,
      bg: "#161826",
      panel: "#232532",
      text: "#e9e9ed",
      dotPrimary: "#b5abfc",
      dotSecondary: "#5d5294",
      mesh: "#968ae0",
      active: "#9184d9", // --color-accent
      connection: "#9184d9",
      rim: "#5d5294",
      additive: true,
    },
  },
  "cloudflare-claro": {
    label: "Cloudflare claro",
    params: {
      ...NUMBERS,
      bg: "#ffffff",
      panel: "#faf7f3",
      text: "#111111",
      dotPrimary: "#f56a1c",
      dotSecondary: "#f3a06b",
      mesh: "#d9d5d0", // ajuste: #e9e7e3 (texto de referência) some sobre o branco e não dá volume
      active: "#f56a1c",
      connection: "#f5b18c",
      rim: "#e9e7e3",
      dotSize: 1.3,
      frontOpacity: 0.95,
      backOpacity: 0.2,
      meshOpacity: 0.9,
      glowOpacity: 0.1,
      additive: false,
    },
  },
};

export const DEFAULT_PRESET: PresetId = "nocturne-laranja";

export type ColorKey = "bg" | "panel" | "text" | "dotPrimary" | "dotSecondary" | "mesh" | "active" | "connection" | "rim";
export const COLOR_FIELDS: { key: ColorKey; label: string }[] = [
  { key: "bg", label: "Fundo" },
  { key: "panel", label: "Painel (callout)" },
  { key: "text", label: "Texto" },
  { key: "dotPrimary", label: "Ponto primário" },
  { key: "dotSecondary", label: "Ponto secundário" },
  { key: "mesh", label: "Malha anatômica" },
  { key: "active", label: "Ativo (seleção/marcador)" },
  { key: "connection", label: "Conexões" },
  { key: "rim", label: "Aro / brilho" },
];

export type NumberKey = "dotSize" | "dotSmallRatio" | "count" | "frontOpacity" | "backOpacity" | "meshOpacity" | "rimWidth" | "glowWidth" | "glowOpacity" | "turnSeconds";
export const NUMBER_FIELDS: { key: NumberKey; label: string; min: number; max: number; step: number; unit?: string }[] = [
  { key: "dotSize", label: "Ponto primário", min: 0.5, max: 3, step: 0.05, unit: "px" },
  { key: "dotSmallRatio", label: "Ponto secundário (proporção)", min: 0.3, max: 1, step: 0.05 },
  { key: "count", label: "Densidade", min: 2000, max: 39000, step: 500, unit: "pontos" },
  { key: "frontOpacity", label: "Opacidade frontal", min: 0.1, max: 1, step: 0.01 },
  { key: "backOpacity", label: "Opacidade posterior", min: 0, max: 1, step: 0.01 },
  { key: "meshOpacity", label: "Opacidade da malha", min: 0, max: 1, step: 0.01 },
  { key: "rimWidth", label: "Espessura do aro", min: 0, max: 4, step: 0.1, unit: "px" },
  { key: "glowWidth", label: "Largura do brilho", min: 0, max: 20, step: 0.5, unit: "px" },
  { key: "glowOpacity", label: "Opacidade do brilho", min: 0, max: 0.6, step: 0.01 },
  { key: "turnSeconds", label: "Segundos por volta (0 = parado)", min: 0, max: 180, step: 5, unit: "s" },
];

const HEX = /^#[0-9a-f]{6}$/i;
export const isHex = (v: unknown): v is string => typeof v === "string" && HEX.test(v);

/** Aceita um objeto parcial/arbitrário e devolve parâmetros válidos (valores inválidos caem no preset base). */
export function sanitize(input: unknown, base: BrainParams): BrainParams {
  const out: BrainParams = { ...base };
  if (!input || typeof input !== "object") return out;
  const src = input as Record<string, unknown>;
  for (const { key } of COLOR_FIELDS) if (isHex(src[key])) out[key] = (src[key] as string).toLowerCase();
  for (const f of NUMBER_FIELDS) {
    const v = src[f.key];
    if (typeof v === "number" && Number.isFinite(v)) out[f.key] = Math.min(f.max, Math.max(f.min, v));
  }
  if (typeof src.additive === "boolean") out.additive = src.additive;
  return out;
}

export type BrainConfig = { preset: PresetId; params: BrainParams };

export function configFromPreset(preset: PresetId): BrainConfig {
  return { preset, params: { ...PRESETS[preset].params } };
}

/** JSON exportável: preset de origem + todos os valores. */
export function exportConfig(c: BrainConfig): string {
  return JSON.stringify({ version: 1, preset: c.preset, params: c.params }, null, 2);
}

export function importConfig(text: string): BrainConfig {
  const data = JSON.parse(text) as { preset?: string; params?: unknown };
  const preset = (data.preset && data.preset in PRESETS ? data.preset : DEFAULT_PRESET) as PresetId;
  return { preset, params: sanitize(data.params, PRESETS[preset].params) };
}

/** Só as diferenças em relação ao preset, em base64url — vai em `?cfg=` e mantém a URL curta e compartilhável. */
export function encodeConfig(c: BrainConfig): string {
  const base = PRESETS[c.preset].params as Record<string, unknown>;
  const diff: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(c.params)) if (base[k] !== v) diff[k] = v;
  const json = JSON.stringify({ p: c.preset, d: diff });
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeConfig(s: string): BrainConfig | null {
  try {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(escape(atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4))));
    const { p, d } = JSON.parse(json) as { p: string; d: unknown };
    const preset = (p in PRESETS ? p : DEFAULT_PRESET) as PresetId;
    return { preset, params: sanitize(d, PRESETS[preset].params) };
  } catch {
    return null;
  }
}

// ── contraste WCAG 2.x ──────────────────────────────────────────────────────
function luminance(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
export function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
}

export type ContrastCheck = { id: string; label: string; ratio: number; min: number; ok: boolean };
export function contrastChecks(p: BrainParams): ContrastCheck[] {
  const rows: [string, string, string, string, number][] = [
    ["marker", "Marcador (ativo) × fundo", p.active, p.bg, 3],
    ["text", "Texto × painel", p.text, p.panel, 4.5],
    ["dot", "Ponto primário × fundo", p.dotPrimary, p.bg, 3],
    ["connection", "Conexões × fundo", p.connection, p.bg, 3],
  ];
  return rows.map(([id, label, a, b, min]) => {
    const ratio = contrast(a, b);
    return { id, label, ratio, min, ok: ratio >= min };
  });
}
