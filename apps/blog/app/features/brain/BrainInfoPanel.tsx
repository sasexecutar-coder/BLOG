// Callout: borda tracejada, 4 colchetes de canto, sem preenchimento. Fica fora do canvas (abaixo no mobile, ao lado no desktop),
// por isso nunca cobre o cérebro nem o marcador. Textos exatos vêm de brainNetworks.data.ts.
import { BRAIN_FUNCTIONS, CONCEPTUAL_NOTICE } from "./brainNetworks.data";
import type { ViewMode } from "./brainRuntime";

export function BrainInfoPanel({ selected, mode, onToggleNetwork }: { selected: number; mode: ViewMode; onToggleNetwork: () => void }) {
  const fn = selected >= 0 ? BRAIN_FUNCTIONS[selected] : null;
  return (
    <aside className="brain-callout" aria-live="polite" data-callout={fn?.id ?? "none"}>
      <span className="brain-callout__corner brain-callout__corner--tl" aria-hidden="true" />
      <span className="brain-callout__corner brain-callout__corner--tr" aria-hidden="true" />
      <span className="brain-callout__corner brain-callout__corner--bl" aria-hidden="true" />
      <span className="brain-callout__corner brain-callout__corner--br" aria-hidden="true" />
      {fn ? (
        <>
          <h2 className="brain-callout__title">{fn.label}</h2>
          <p className="brain-callout__text">{fn.text}</p>
          <button type="button" className="brain-link" aria-pressed={mode === 2} onClick={onToggleNetwork}>
            {mode === 2 ? "Ocultar rede" : "Destacar rede"}
          </button>
        </>
      ) : (
        <>
          <h2 className="brain-callout__title">Funções executivas</h2>
          <p className="brain-callout__text">Toque em um marcador para ver a função.</p>
        </>
      )}
      <p className="brain-callout__notice">{CONCEPTUAL_NOTICE}</p>
    </aside>
  );
}
