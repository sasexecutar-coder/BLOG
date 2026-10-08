// Painel "Ajustar visual": presets, cada cor em hex e em seletor, todos os números, contraste WCAG ao vivo,
// exportar/importar JSON. O estado fica na URL (compartilhável); nada é gravado no navegador.
import { useId, useState } from "react";
import {
  COLOR_FIELDS, DEFAULT_PRESET, NUMBER_FIELDS, PRESETS, configFromPreset, contrastChecks, exportConfig, importConfig, isHex,
  type BrainConfig, type ColorKey, type PresetId,
} from "./brainTheme";

export function BrainControls({ config, onChange, available, open, onOpenChange }: {
  config: BrainConfig; onChange: (c: BrainConfig) => void; available: number; open: boolean; onOpenChange: (o: boolean) => void;
}) {
  const id = useId();
  const [json, setJson] = useState("");
  const [msg, setMsg] = useState("");
  const checks = contrastChecks(config.params);
  const set = (patch: Partial<BrainConfig["params"]>) => onChange({ ...config, params: { ...config.params, ...patch } });

  return (
    <div className="brain-controls">
      <button type="button" className="brain-btn" aria-expanded={open} aria-controls={`${id}-panel`} onClick={() => onOpenChange(!open)}>
        Ajustar visual
      </button>
      {open ? (
        <div id={`${id}-panel`} className="brain-controls__panel" role="region" aria-label="Ajustar visual do cérebro">
          <label className="brain-field">
            <span>Preset</span>
            <select value={config.preset} onChange={(e) => onChange(configFromPreset(e.target.value as PresetId))}>
              {Object.entries(PRESETS).map(([k, p]) => <option key={k} value={k}>{p.label}</option>)}
            </select>
          </label>

          <fieldset className="brain-fieldset">
            <legend>Cores (hex)</legend>
            {COLOR_FIELDS.map(({ key, label }) => (
              <ColorRow key={key} label={label} value={config.params[key]} onChange={(v) => set({ [key]: v } as Partial<BrainConfig["params"]>)} name={key} />
            ))}
            <label className="brain-field brain-field--inline">
              <input type="checkbox" checked={config.params.additive} onChange={(e) => set({ additive: e.target.checked })} />
              <span>Blending aditivo (indicado para fundo escuro)</span>
            </label>
          </fieldset>

          <fieldset className="brain-fieldset">
            <legend>Partículas, malha e movimento</legend>
            {NUMBER_FIELDS.map((f) => {
              const max = f.key === "count" ? Math.max(f.min, available || f.max) : f.max;
              return (
                <label key={f.key} className="brain-field">
                  <span>{f.label}</span>
                  <input type="range" min={f.min} max={max} step={f.step} value={config.params[f.key]} data-param={f.key}
                    onChange={(e) => set({ [f.key]: Number(e.target.value) } as Partial<BrainConfig["params"]>)} />
                  <output>{Number(config.params[f.key]).toLocaleString("pt-BR")}{f.unit ? ` ${f.unit}` : ""}</output>
                </label>
              );
            })}
          </fieldset>

          <fieldset className="brain-fieldset">
            <legend>Contraste (WCAG)</legend>
            <ul className="brain-contrast">
              {checks.map((c) => (
                <li key={c.id} data-ok={c.ok} data-check={c.id}>
                  <span>{c.label}</span>
                  <b>{c.ratio.toFixed(2).replace(".", ",")}:1</b>
                  <em>{c.ok ? `ok (≥ ${String(c.min).replace(".", ",")}:1)` : `abaixo de ${String(c.min).replace(".", ",")}:1`}</em>
                </li>
              ))}
            </ul>
          </fieldset>

          <fieldset className="brain-fieldset">
            <legend>Configuração (JSON)</legend>
            <textarea aria-label="JSON da configuração" rows={6} value={json} onChange={(e) => setJson(e.target.value)} placeholder="Cole aqui um JSON exportado e aplique." spellCheck={false} />
            <div className="brain-row">
              <button type="button" className="brain-btn" onClick={() => { setJson(exportConfig(config)); setMsg("Configuração atual exportada abaixo."); }}>Exportar</button>
              <button type="button" className="brain-btn" onClick={() => {
                try { onChange(importConfig(json)); setMsg("Configuração aplicada."); } catch { setMsg("JSON inválido."); }
              }}>Aplicar</button>
              <button type="button" className="brain-btn" onClick={() => { onChange(configFromPreset(DEFAULT_PRESET)); setMsg("Restaurado o preset padrão."); }}>Restaurar preset</button>
            </div>
            <p className="brain-msg" role="status">{msg}</p>
          </fieldset>
        </div>
      ) : null}
    </div>
  );
}

function ColorRow({ label, value, onChange, name }: { label: string; value: string; onChange: (v: string) => void; name: ColorKey }) {
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? value;
  return (
    <div className="brain-field brain-field--color">
      <span>{label}</span>
      <input type="color" aria-label={`${label} (seletor)`} value={value} onChange={(e) => { setDraft(null); onChange(e.target.value); }} />
      <input type="text" aria-label={`${label} (hex)`} data-color={name} value={shown} maxLength={7} spellCheck={false}
        aria-invalid={draft !== null && !isHex(draft)}
        onChange={(e) => { const v = e.target.value; setDraft(v); if (isHex(v)) { onChange(v.toLowerCase()); setDraft(null); } }}
        onBlur={() => setDraft(null)} />
    </div>
  );
}
