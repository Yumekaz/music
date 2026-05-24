import { SlidersHorizontal } from "lucide-react";
import { useEqualizer } from "../../hooks/useEqualizer.js";
import { useSettingsStore } from "../../store/settingsStore.js";
import { EQUALIZER_PRESETS } from "./EqualizerPresets.js";

export function Equalizer({ audioRef, enabled }) {
  const {
    equalizerOpen,
    equalizerEnabled,
    equalizerPreset,
    equalizerGains,
    setBandGain,
    setEqualizerEnabled,
    setEqualizerOpen,
    setEqualizerPreset
  } = useSettingsStore();
  const { bands } = useEqualizer(audioRef, enabled && equalizerEnabled, equalizerGains);

  function togglePanel() {
    const nextOpen = !equalizerOpen;
    setEqualizerOpen(nextOpen);
    if (nextOpen && !equalizerEnabled) setEqualizerEnabled(true);
  }

  return (
    <section className="relative grid justify-items-end gap-[6px]" aria-label="Equalizer">
      <button
        type="button"
        className="inline-flex items-center gap-[10px] min-h-[38px] px-[16px] border border-line rounded-full bg-night text-ink font-bold cursor-pointer transition-all duration-[160ms] hover:border-[#1ed760] hover:text-[#1ed760]"
        onClick={togglePanel}
        aria-expanded={equalizerOpen}
        aria-pressed={equalizerEnabled}
      >
        <SlidersHorizontal size={16} aria-hidden="true" />
        <span>EQ</span>
      </button>
      {!enabled ? <p className="max-w-[220px] m-0 text-muted text-[0.78rem] text-right">EQ applies to preview and Jamendo tracks.</p> : null}
      {equalizerOpen ? (
        <div className="absolute right-0 bottom-[52px] w-[min(520px,calc(100vw-32px))] grid gap-[18px] p-[18px] border border-line rounded-[8px] bg-panel shadow-[0_24px_80px_rgba(0,0,0,0.42)] z-50">
          <div className="flex items-center gap-[12px] bg-[rgba(255,255,255,0.03)] py-[8px] px-[12px] rounded-[6px] border border-[rgba(255,255,255,0.05)]">
            <label htmlFor="eq-preset-select" className="text-[0.85rem] font-semibold text-muted">Preset:</label>
            <select
              id="eq-preset-select"
              className="flex-1 bg-night border border-line rounded-[4px] text-ink text-[0.88rem] py-[6px] px-[12px] cursor-pointer outline-none transition-colors duration-[160ms] hover:border-accent focus:border-accent"
              value={equalizerPreset}
              onChange={(e) => {
                const name = e.target.value;
                setEqualizerPreset(name, EQUALIZER_PRESETS[name]);
              }}
            >
              {Object.keys(EQUALIZER_PRESETS).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-[12px] md:gap-[10px]">
            {bands.map((band, index) => (
              <label key={band.frequency} className="grid justify-items-center gap-[8px] text-muted text-[0.78rem]">
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={equalizerGains[index]}
                  disabled={!enabled || !equalizerEnabled}
                  onChange={(event) => setBandGain(index, Number(event.target.value))}
                  aria-label={`${band.label} Hz gain`}
                  className="h-[120px] [writing-mode:vertical-lr] [direction:rtl]"
                />
                <span>{band.label}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
