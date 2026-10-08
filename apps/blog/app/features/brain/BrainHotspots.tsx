// Marcadores = botões HTML sobre o canvas (acessíveis, 44 px de alvo, círculo de 36 px). A posição vem de `runtime`,
// escrita a cada quadro pela cena; aqui só aplicamos transform/opacity direto no DOM, sem re-render.
import { ArrowsClockwise, CalendarBlank, Copy, Prohibit, type Icon } from "@phosphor-icons/react";
import { forwardRef } from "react";
import { BRAIN_FUNCTIONS, type BrainFunction } from "./brainNetworks.data";

const ICONS: Record<BrainFunction["icon"], Icon> = { calendar: CalendarBlank, prohibit: Prohibit, squares: Copy, refresh: ArrowsClockwise };

/** Opacidade do marcador em função da orientação da superfície em relação à câmera (facing = n·v). */
export function markerAlpha(facing: number) {
  if (facing <= -0.2) return 0;
  if (facing < -0.1) return (0.35 * (facing + 0.2)) / 0.1;
  const t = Math.min(1, Math.max(0, (facing + 0.1) / 0.4));
  return 0.35 + 0.65 * (t * t * (3 - 2 * t));
}
/** Marcador "visível": opacidade ≥ 0,3 (a partir de facing ≥ −0,1). */
export const isMarkerVisible = (facing: number) => markerAlpha(facing) >= 0.3;

export type HotspotsProps = {
  selected: number;
  onSelect: (index: number) => void;
  /** overlay = posicionado pela cena; list = fila estática (sem WebGL). */
  layout: "overlay" | "list";
  registerRef?: (index: number, el: HTMLButtonElement | null) => void;
};

export function BrainHotspots({ selected, onSelect, layout, registerRef }: HotspotsProps) {
  return (
    <div className={`brain-hotspots brain-hotspots--${layout}`} role="group" aria-label="Marcadores das funções executivas">
      {BRAIN_FUNCTIONS.map((f, i) => (
        <Marker key={f.id} fn={f} index={i} pressed={selected === i} layout={layout} onSelect={onSelect} ref={(el) => registerRef?.(i, el)} />
      ))}
    </div>
  );
}

const Marker = forwardRef<HTMLButtonElement, { fn: BrainFunction; index: number; pressed: boolean; layout: "overlay" | "list"; onSelect: (i: number) => void }>(
  function Marker({ fn, index, pressed, layout, onSelect }, ref) {
    const Glyph = ICONS[fn.icon];
    return (
      <button
        ref={ref}
        type="button"
        className="brain-marker"
        aria-pressed={pressed}
        aria-label={`Marcador: ${fn.label}`}
        data-marker={fn.id}
        onClick={() => onSelect(index)}
      >
        <span className="brain-marker__disc"><Glyph size={18} weight="regular" aria-hidden="true" /></span>
        {layout === "list" ? <span className="brain-marker__label">{fn.label}</span> : null}
      </button>
    );
  },
);
