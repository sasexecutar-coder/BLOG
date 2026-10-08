// HOME-BRAIN-001 — mapa interativo (Home e /mapas usam este mesmo componente).
// A cena 3D só é carregada no cliente, depois da hidratação. Sem WebGL (ou se o GLB falhar), o pôster e os marcadores
// em fila continuam funcionando, com o mesmo painel de explicação.
import { Component, lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { BrainControls } from "./BrainControls";
import { BrainHotspots, isMarkerVisible, markerAlpha } from "./BrainHotspots";
import { BrainInfoPanel } from "./BrainInfoPanel";
import { ANGLES, makeRuntime, type BrainControl, type BrainReady, type ViewMode } from "./brainRuntime";
import { BRAIN_FUNCTIONS } from "./brainNetworks.data";
import {
  DEFAULT_PRESET, PRESETS, configFromPreset, contrast, contrastChecks, decodeConfig, encodeConfig, type BrainConfig, type PresetId,
} from "./brainTheme";
import "./brain-map.css";

const BrainCanvas = lazy(() => import("./BrainCanvas"));
const POSTER_URL = "/models/home-brain/brain-poster.png";
const INITIAL_ASPECT = 1 / 0.9325; // 1 / (1,1 × k); corrigido assim que a cena mede o enquadramento

type Env = { mounted: boolean; webgl: boolean; reduced: boolean; visible: boolean; debug: boolean; freeze: boolean; angle: number; failed: boolean };

class Boundary extends Component<{ onError: () => void; children: ReactNode }, { bad: boolean }> {
  state = { bad: false };
  static getDerivedStateFromError() { return { bad: true }; }
  componentDidCatch(error: unknown) { console.error(error); this.props.onError(); }
  render() { return this.state.bad ? null : this.props.children; }
}

function parseAngle(v: string | null): number {
  if (!v) return ANGLES.lateral;
  if (v in ANGLES) return ANGLES[v as keyof typeof ANGLES];
  const deg = Number(v);
  return Number.isFinite(deg) ? (deg * Math.PI) / 180 : ANGLES.lateral;
}

export function BrainNetworkMap({ heading }: { heading: string }) {
  const [config, setConfig] = useState<BrainConfig>(() => configFromPreset(DEFAULT_PRESET));
  const [selected, setSelected] = useState(-1);
  const [mode, setMode] = useState<ViewMode>(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [paused, setPaused] = useState(false);
  const [aspect, setAspect] = useState(INITIAL_ASPECT);
  const [available, setAvailable] = useState(0);
  const [tick, setTick] = useState(0);
  const [env, setEnv] = useState<Env>({ mounted: false, webgl: false, reduced: false, visible: true, debug: false, freeze: false, angle: ANGLES.lateral, failed: false });

  const stage = useRef<HTMLDivElement>(null);
  const callout = useRef<HTMLDivElement>(null);
  const markerEls = useRef<(HTMLButtonElement | null)[]>([]);
  const runtime = useRef(makeRuntime());
  const control = useRef<BrainControl>({ paused: false, nudge: 0, reset: false, focus: null });
  const pointer = useRef<{ x: number; y: number } | null>(null);

  // ambiente do cliente: parâmetros da URL, WebGL, movimento reduzido
  useEffect(() => {
    const qs = new URLSearchParams(window.location.search);
    const cfg = qs.get("cfg") ? decodeConfig(qs.get("cfg")!) : null;
    const presetQ = qs.get("preset");
    if (cfg) setConfig(cfg); else if (presetQ && presetQ in PRESETS) setConfig(configFromPreset(presetQ as PresetId));
    if (qs.get("controls") === "1") setPanelOpen(true);
    let webgl = false;
    try {
      const c = document.createElement("canvas");
      webgl = !qs.has("nowebgl") && !!(c.getContext("webgl2") || c.getContext("webgl"));
    } catch { webgl = false; }
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduced = mq.matches;
    setEnv((e) => ({ ...e, mounted: true, webgl, reduced, debug: qs.get("debug") === "1", freeze: qs.get("freeze") === "1", angle: parseAngle(qs.get("angle")) }));
    const on = () => setEnv((e) => ({ ...e, reduced: mq.matches }));
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // pausa fora da área visível
  useEffect(() => {
    if (!stage.current) return;
    const io = new IntersectionObserver(([e]) => setEnv((s) => ({ ...s, visible: e.isIntersecting })));
    io.observe(stage.current);
    return () => io.disconnect();
  }, []);

  // a configuração vai para a URL (compartilhável); nada em localStorage
  useEffect(() => {
    if (!env.mounted) return;
    const url = new URL(window.location.href);
    const enc = encodeConfig(config);
    const isDefault = config.preset === DEFAULT_PRESET && enc === encodeConfig(configFromPreset(DEFAULT_PRESET));
    if (isDefault) url.searchParams.delete("cfg"); else url.searchParams.set("cfg", enc);
    url.searchParams.delete("preset");
    window.history.replaceState(null, "", url);
  }, [config, env.mounted]);

  const select = useCallback((i: number) => {
    setSelected((cur) => {
      const next = cur === i ? -1 : i;
      setMode(next < 0 ? 0 : 1);
      // gira até o marcador ficar de frente para a câmera (rotY = azimute − 90°)
      if (next >= 0) control.current.focus = ((BRAIN_FUNCTIONS[next].azimuthDeg - 90) * Math.PI) / 180;
      return next;
    });
  }, []);
  const clear = useCallback(() => { setSelected(-1); setMode(0); }, []);
  const toggleNetwork = useCallback(() => setMode((m) => (m === 2 ? 1 : 2)), []);

  // marcadores: posição/opacidade escritas direto no DOM a cada quadro da cena
  useEffect(() => {
    runtime.current.onFrame = (r) => {
      r.markers.forEach((m, i) => {
        const el = markerEls.current[i];
        if (!el) return;
        const a = markerAlpha(m.facing);
        el.style.transform = `translate(${m.x.toFixed(1)}px, ${m.y.toFixed(1)}px)`;
        el.style.opacity = a.toFixed(3);
        const vis = isMarkerVisible(m.facing);
        el.style.pointerEvents = vis ? "auto" : "none";
        el.tabIndex = vis ? 0 : -1;
        el.dataset.visible = vis ? "1" : "0";
      });
    };
    return () => { runtime.current.onFrame = undefined; };
  }, []);

  const showCanvas = env.mounted && env.webgl && !env.failed;
  const [ready, setReady] = useState(false);
  const onReady = useCallback((r: BrainReady) => { setAspect(r.aspect); setAvailable(r.available); setReady(true); }, []);
  const fallback = env.mounted && !showCanvas;

  // painel de debug (?debug=1): números por quadro, lidos a 4 Hz
  useEffect(() => {
    if (!env.debug) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 250);
    return () => window.clearInterval(id);
  }, [env.debug]);
  const debugRows = useMemo(() => {
    if (!env.debug) return null;
    void tick;
    const r = runtime.current;
    const visibleMarkers = r.markers.filter((m) => isMarkerVisible(m.facing)).length;
    const calloutBox = callout.current?.getBoundingClientRect();
    const overlaps = calloutBox ? markerEls.current.filter((el) => {
      if (!el) return false;
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.left < calloutBox.right && b.right > calloutBox.left && b.top < calloutBox.bottom && b.bottom > calloutBox.top;
    }).length : 0;
    return {
      widthPct: Number((r.widthPct * (r.size[0] / window.innerWidth)).toFixed(1)),
      points: r.points, available: r.available, camDist: Number(r.camDist.toFixed(3)), rotYDeg: Number(r.rotYDeg.toFixed(1)),
      visibleMarkers, markerTextIntersections: overlaps, init: r.init, size: r.size, ready,
      contrast: Object.fromEntries(contrastChecks(config.params).map((c) => [c.id, Number(c.ratio.toFixed(2))])),
    };
  }, [env.debug, tick, config.params, ready]);
  useEffect(() => { if (env.debug) (window as unknown as { __brain?: unknown }).__brain = debugRows; }, [env.debug, debugRows]);

  const p = config.params;
  const onActive = contrast(p.active, p.bg) >= contrast(p.active, p.text) ? p.bg : p.text;
  const style = {
    "--brain-bg": p.bg, "--brain-panel": p.panel, "--brain-text": p.text, "--brain-active": p.active, "--brain-rim": p.rim,
    "--brain-dot": p.dotPrimary, "--brain-on-active": onActive,
  } as React.CSSProperties;

  return (
    <section className="brain-map" style={style} onKeyDown={(e) => { if (e.key === "Escape") clear(); }} data-preset={config.preset}>
      <header className="brain-map__header">
        <h1 className="brain-map__title">{heading}</h1>
      </header>

      <div className="brain-map__body">
        <div
          ref={stage}
          className="brain-stage"
          style={{ aspectRatio: aspect }}
          data-ready={ready ? "1" : undefined}
          data-fallback={fallback ? "1" : undefined}
          onPointerDown={(e) => { pointer.current = { x: e.clientX, y: e.clientY }; }}
          onPointerUp={(e) => {
            const s = pointer.current; pointer.current = null;
            if (!s || (e.target as HTMLElement).closest(".brain-marker")) return;
            if (Math.hypot(e.clientX - s.x, e.clientY - s.y) < 6) clear();
          }}
        >
          {showCanvas ? (
            <Boundary onError={() => setEnv((e) => ({ ...e, failed: true }))}>
              <Suspense fallback={<p className="brain-stage__msg">Carregando…</p>}>
                <BrainCanvas
                  frameloop={!env.visible ? "never" : env.reduced ? "demand" : "always"}
                  params={p} selected={selected} mode={mode} control={control} runtime={runtime}
                  debug={env.debug} startAngle={env.angle} freeze={env.freeze} reducedMotion={env.reduced} onReady={onReady}
                />
              </Suspense>
            </Boundary>
          ) : (
            <img className="brain-stage__poster" src={POSTER_URL} alt="Cérebro visto de lado, formado por pontos" loading="eager" />
          )}
          {showCanvas ? (
            <BrainHotspots layout="overlay" selected={selected} onSelect={select} registerRef={(i, el) => { markerEls.current[i] = el; }} />
          ) : null}
        </div>

        <div className="brain-side" ref={callout}>
          {fallback ? <BrainHotspots layout="list" selected={selected} onSelect={select} /> : null}
          <ul className="brain-chips" aria-label="Funções executivas">
            {BRAIN_FUNCTIONS.map((f, i) => (
              <li key={f.id}><button type="button" className="brain-chip" aria-pressed={selected === i} onClick={() => select(i)}>{f.label}</button></li>
            ))}
          </ul>
          <BrainInfoPanel selected={selected} mode={mode} onToggleNetwork={toggleNetwork} />
          {showCanvas ? (
            <div className="brain-row" role="group" aria-label="Controles do movimento">
              <button type="button" className="brain-btn" aria-pressed={paused} onClick={() => { setPaused((v) => { control.current.paused = !v; return !v; }); }}>{paused ? "Retomar" : "Pausar"}</button>
              <button type="button" className="brain-btn" onClick={() => { control.current.nudge = -Math.PI / 6; }}>Girar ◀</button>
              <button type="button" className="brain-btn" onClick={() => { control.current.nudge = Math.PI / 6; }}>Girar ▶</button>
              <button type="button" className="brain-btn" onClick={() => { control.current.reset = true; }}>Restaurar vista</button>
            </div>
          ) : null}
        </div>
      </div>

      <BrainControls config={config} onChange={setConfig} available={available} open={panelOpen} onOpenChange={setPanelOpen} />

      {debugRows ? (
        <pre className="brain-debug" aria-label="Painel de debug" data-debug>{JSON.stringify(debugRows, null, 1)}</pre>
      ) : null}
    </section>
  );
}
